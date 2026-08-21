#!/usr/bin/env python3
"""Fetch the linked maimai sources and build the static catalogue data."""

from __future__ import annotations

import html
import json
import gzip
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data.js"

FANDOM_API = "https://maimai-intl.fandom.com/api.php"
FANDOM_PAGE = "Collection_-_Title"
FANDOM_COLLECTION_PAGE = "Collection"
JERRY_FRAMES_API = "https://api.jerry.games/versions/frames"
JERRY_PLATES_API = "https://api.jerry.games/versions/plates"

SOURCE_LIST = [
    {
        "id": "fandom-title",
        "name": "maimai International Wiki, title archive",
        "url": "https://maimai-intl.fandom.com/wiki/Collection_-_Title",
        "role": "Base title archive",
    },
    {
        "id": "fandom-collection",
        "name": "maimai International Wiki, collection archive",
        "url": "https://maimai-intl.fandom.com/wiki/Collection",
        "role": "Collection cross-check",
    },
    {
        "id": "remy-collection",
        "name": "SilentBlue.RemyWiki",
        "url": "https://silentblue.remywiki.com/maimai:Collection",
        "role": "Collection definitions and history",
    },
    {
        "id": "jerry-jewels",
        "name": "jerry.games, jewels",
        "url": "https://jerry.games/plates/frames",
        "role": "Jewels and artwork",
    },
    {
        "id": "jerry-plates",
        "name": "jerry.games, plates",
        "url": "https://jerry.games/plates/overview",
        "role": "Plate versions and chart requirements",
    },
    {
        "id": "gamerch-title-1",
        "name": "Gamerch, DX title list 1",
        "url": "https://gamerch.com/maimai/534179",
        "role": "Current title cross-check",
    },
    {
        "id": "gamerch-title-2",
        "name": "Gamerch, DX title list 2",
        "url": "https://gamerch.com/maimai/927504",
        "role": "Current title cross-check",
    },
    {
        "id": "gamerch-title-3",
        "name": "Gamerch, DX title list 3",
        "url": "https://gamerch.com/maimai/818898",
        "role": "Current title cross-check",
    },
    {
        "id": "gamerch-general-titles",
        "name": "Gamerch, general DX titles",
        "url": "https://gamerch.com/maimai/703830",
        "role": "General title cross-check",
    },
    {
        "id": "gamerch-collection",
        "name": "Gamerch, DX collection list",
        "url": "https://gamerch.com/maimai/533650",
        "role": "Current icons, plates, frames, and partners",
    },
    {
        "id": "gamerch-past-collection",
        "name": "Gamerch, past DX collections",
        "url": "https://gamerch.com/maimai/533880",
        "role": "Archived icons, plates, frames, and partners",
    },
    {
        "id": "gamerch-finale-collection",
        "name": "Gamerch, FiNALE carry-over collection",
        "url": "https://gamerch.com/maimai/533882",
        "role": "Legacy carry-over items",
    },
    {
        "id": "gamerch-limited-collection",
        "name": "Gamerch, limited event collections",
        "url": "https://gamerch.com/maimai/533585",
        "role": "Time-limited rewards",
    },
    {
        "id": "gamerch-icon-list",
        "name": "Gamerch, icon list",
        "url": "https://gamerch.com/maimai/533613",
        "role": "Icon archive and availability",
    },
    {
        "id": "gamerch-index",
        "name": "Gamerch maimai index",
        "url": "https://gamerch.com/maimai/",
        "role": "Directory and current version context",
    },
    {
        "id": "namu-titles",
        "name": "NamuWiki, maimai collection titles",
        "url": "https://namu.moe/w/maimai%20%EC%8B%9C%EB%A6%AC%EC%A6%88/%EC%BB%AC%EB%A0%89%EC%85%98/%EC%B9%AD%ED%98%B8",
        "role": "Independent title cross-check",
    },
    {
        "id": "sega-official",
        "name": "SEGA official maimai site",
        "url": "https://maimai.sega.jp/special/maimaiBox3/",
        "role": "Official version and collection context",
    },
]

GAMERCH_TITLE_PAGES = {
    "gamerch-title-1": "https://gamerch.com/maimai/534179",
    "gamerch-title-2": "https://gamerch.com/maimai/927504",
    "gamerch-title-3": "https://gamerch.com/maimai/818898",
    "gamerch-general-titles": "https://gamerch.com/maimai/703830",
    "gamerch-finale-collection": "https://gamerch.com/maimai/533882",
}
GAMERCH_COLLECTION_PAGES = {
    "gamerch-collection": "https://gamerch.com/maimai/533650",
    "gamerch-past-collection": "https://gamerch.com/maimai/533880",
    "gamerch-finale-collection": "https://gamerch.com/maimai/533882",
    "gamerch-limited-collection": "https://gamerch.com/maimai/533585",
    "gamerch-icon-list": "https://gamerch.com/maimai/533613",
}


def fetch_json(url: str, params: dict[str, str] | None = None) -> dict | list:
    if params:
        url = f"{url}?{urlencode(params)}"
    request = Request(url, headers={"User-Agent": "maimai-collection-atlas/1.0"})
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 maimai-collection-atlas/1.0",
            "Accept-Encoding": "gzip",
        },
    )
    with urlopen(request, timeout=30) as response:
        body = response.read()
        if response.headers.get("Content-Encoding") == "gzip":
            body = gzip.decompress(body)
    return body.decode("utf-8", errors="replace")


def strip_markup(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def heading_text(value: str) -> str:
    value = strip_markup(value)
    return value.removesuffix("[]").strip()


def normalise(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"[^\w\u3040-\u30ff\u3400-\u9fff]+", "", value)


def english_gloss(value: str) -> str:
    """Apply a conservative English reading aid to common Japanese conditions."""
    if not value or not re.search(r"[\u3040-\u30ff\u3400-\u9fff]", value):
        return value
    result = value
    replacements = [
        ("一回のクレジットで", "in one credit"),
        ("2人以上でプレイ", "play with 2 or more players"),
        ("4人でプレイ", "play with 4 players"),
        ("全難易度", "all difficulties"),
        ("はじめから所持", "owned from the start"),
        ("初めから所持", "owned from the start"),
        ("お気に入りカテゴリから", "from the favourites category"),
        ("お気に入りカデコリから", "from the favourites category"),
        ("スタンプを10個集める", "collect 10 stamps"),
        ("上位入賞", "place highly"),
        ("勝利", "win"),
        ("敗北", "lose"),
        ("プレイ", "play"),
        ("達成", "reach"),
        ("累計移動距離", "total travel distance"),
        ("レーティング", "rating"),
        ("ちほー", "area"),
        ("つあーメンバー", "Tour Member"),
        ("をセット", "set"),
        ("セットして", "set"),
        ("回プレイ", " plays"),
        ("個", " items"),
        ("ポイント", " points"),
        ("でらっくす", "DX"),
        ("スタンプ", "stamp"),
    ]
    for old, new in replacements:
        result = result.replace(old, new)
    result = re.sub(r"(\d+)回", r"\1 times", result)
    result = re.sub(r"\s+", " ", result).strip()
    return result if result != value else ""


def parse_titles(
    rendered_html: str,
    source_id: str = "fandom-title",
    source_url: str = "https://maimai-intl.fandom.com/wiki/Collection_-_Title",
) -> list[dict[str, object]]:
    parts = re.split(
        r"(<h[2-4][^>]*>.*?</h[2-4]>|<table[^>]*>.*?</table>)",
        rendered_html,
        flags=re.S,
    )
    current_tier = ""
    current_category = ""
    current_subcategory = ""
    titles: list[dict[str, object]] = []

    for part in parts:
        heading = re.match(r"<h([2-4])[^>]*>(.*?)</h\1>", part, flags=re.S)
        if heading:
            level = int(heading.group(1))
            text = heading_text(heading.group(2))
            if text == "Contents":
                continue
            if level == 2:
                current_tier = text
                current_category = ""
                current_subcategory = ""
            elif level == 3:
                current_category = text
                current_subcategory = ""
            else:
                current_subcategory = text.strip("[]")
            continue

        if not part.startswith("<table"):
            continue

        rows = re.findall(r"<tr.*?</tr>", part, flags=re.S)
        for row in rows:
            cells = re.findall(
                r"<(td|th)([^>]*)>(.*?)</\1>", row, flags=re.S | re.I
            )
            if not cells or cells[0][0].lower() == "th":
                continue

            values = [cell[2] for cell in cells]
            if len(values) == 2 and "<p" in values[0].lower():
                title_html, description_html = re.split(
                    r"<p[^>]*>", values[0], maxsplit=1, flags=re.I
                )
                description_html = re.sub(r"</p>.*$", "", description_html, flags=re.S | re.I)
                values = [title_html, description_html, values[1]]
            if len(values) != 3:
                continue

            title_html, description_html, version_html = values
            titles.append(
                {
                    "title": strip_markup(title_html),
                    "description": strip_markup(description_html),
                    "english_condition": english_gloss(strip_markup(description_html)),
                    "version": strip_markup(version_html),
                    "tier": current_tier,
                    "category": current_category,
                    "subcategory": current_subcategory,
                    "unavailable": bool(
                        re.search(r"<s\b|color\s*:\s*red", title_html + description_html, re.I)
                    ),
                    "sources": [source_id],
                    "source_url": source_url,
                    "added": False,
                    "alternates": [],
                }
            )
    return titles


def parse_gamerch_titles(
    page_html: str, source_id: str, source_url: str
) -> list[dict[str, object]]:
    colours = {
        "#d3d3d3": "Normal",
        "#f5deb3": "Bronze",
        "#f0f8ff": "Silver",
        "#ffd700": "Gold",
        "#f6bfbc": "Rainbow",
    }
    titles: list[dict[str, object]] = []
    current_category = ""
    events = re.finditer(
        r"<h[2-4][^>]*>.*?</h[2-4]>|<table[^>]*>.*?</table>",
        page_html,
        flags=re.S,
    )
    for event in events:
        part = event.group(0)
        heading = re.match(r"<h([2-4])[^>]*>(.*?)</h\1>", part, flags=re.S)
        if heading:
            current_category = strip_markup(heading.group(2))
            continue
        if "称号名" not in part:
            continue
        for row in re.findall(r"<tr.*?</tr>", part, flags=re.S):
            cells = re.findall(
                r"<(td|th)([^>]*)>(.*?)</\1>", row, flags=re.S | re.I
            )
            if len(cells) < 2 or any(cell[0].lower() == "th" for cell in cells):
                continue
            title_html, description_html = cells[0][2], cells[1][2]
            title = strip_markup(title_html)
            description = strip_markup(description_html)
            if not title or title == "称号名":
                continue
            colour = re.search(
                r"background-color\s*:\s*(#[0-9a-f]+)", cells[0][1].lower()
            )
            tier = colours.get(colour.group(1), "") if colour else ""
            titles.append(
                {
                    "title": title,
                    "description": description,
                    "english_condition": english_gloss(description),
                    "version": "",
                    "tier": tier or "Unlabelled",
                    "category": current_category,
                    "subcategory": "",
                    "unavailable": False,
                    "sources": [source_id],
                    "source_url": source_url,
                    "added": True,
                    "alternates": [],
                }
            )
    return titles


def parse_collectibles(
    rendered_html: str, source_id: str, source_url: str
) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    family = ""
    section = ""
    subsection = ""
    events = re.finditer(
        r"<h[2-4][^>]*>.*?</h[2-4]>|<table[^>]*>.*?</table>",
        rendered_html,
        flags=re.S,
    )
    for event in events:
        part = event.group(0)
        heading = re.match(r"<h([2-4])[^>]*>(.*?)</h\1>", part, flags=re.S)
        if heading:
            level = int(heading.group(1))
            text = heading_text(heading.group(2))
            if text == "Contents":
                continue
            if level == 2:
                family, section, subsection = text, "", ""
            elif level == 3:
                section, subsection = text, ""
            else:
                subsection = text.strip("[]")
            continue
        if not part.startswith("<table"):
            continue
        header_cells = re.findall(r"<th[^>]*>(.*?)</th>", part, flags=re.S | re.I)
        headers = [strip_markup(value) for value in header_cells]
        if not headers or family not in {"Icon", "Plate", "Frame"}:
            continue
        if family == "Icon" and "Name" not in headers:
            continue
        if family == "Plate" and "Plate" not in headers:
            continue
        if family == "Frame" and "Frame" not in headers:
            continue
        for row in re.findall(r"<tr.*?</tr>", part, flags=re.S):
            cells = re.findall(
                r"<(td|th)([^>]*)>(.*?)</\1>", row, flags=re.S | re.I
            )
            if not cells or any(cell[0].lower() == "th" for cell in cells):
                continue
            values = [strip_markup(cell[2]) for cell in cells]
            if family == "Icon":
                name_index = headers.index("Name")
                translation_index = headers.index("Translation")
                condition_index = headers.index("Conditions")
                location_index = headers.index("Where to get") if "Where to get" in headers else -1
                name = values[name_index] if name_index < len(values) else ""
                translation = values[translation_index] if translation_index < len(values) else ""
                conditions = values[condition_index] if condition_index < len(values) else ""
                location = values[location_index] if location_index >= 0 and location_index < len(values) else ""
                item_type = "Icon"
            else:
                name_index = headers.index("Name")
                translation_index = headers.index("Translation")
                condition_index = headers.index("Conditions")
                name = values[name_index] if name_index < len(values) else ""
                translation = values[translation_index] if translation_index < len(values) else ""
                conditions = values[condition_index] if condition_index < len(values) else ""
                location = ""
                item_type = "Name plate" if family == "Plate" else "Frame"
            if not name:
                continue
            items.append(
                {
                    "type": item_type,
                    "name": name,
                    "translation": translation,
                    "conditions": conditions,
                    "english_condition": english_gloss(conditions),
                    "location": location,
                    "section": " / ".join(value for value in [section, subsection] if value),
                    "sources": [source_id],
                    "source_url": source_url,
                    "alternates": [],
                }
            )
    return items


def parse_gamerch_collectibles(page_html: str, source_id: str, source_url: str) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    family = ""
    section = ""
    header_types = {
        "アイコン名": "Icon",
        "プレート名": "Name plate",
        "フレーム名": "Frame",
        "パートナー名": "Partner",
    }
    type_names = {
        "アイコン": "Icon",
        "でかアイコン": "Big icon",
        "ネームプレート": "Name plate",
        "フレーム": "Frame",
        "称号": "Title reward",
        "パートナー": "Partner",
    }
    for event in re.finditer(
        r"<h[2-4][^>]*>.*?</h[2-4]>|<table[^>]*>.*?</table>",
        page_html,
        flags=re.S,
    ):
        part = event.group(0)
        heading = re.match(r"<h([2-4])[^>]*>(.*?)</h\1>", part, flags=re.S)
        if heading:
            level = int(heading.group(1))
            text = strip_markup(heading.group(2))
            if level == 2:
                family, section = text, ""
            elif level == 3:
                section = text
            continue
        if not part.startswith("<table"):
            continue
        header_cells = re.findall(r"<th[^>]*>(.*?)</th>", part, flags=re.S | re.I)
        headers = [strip_markup(value) for value in header_cells]
        type_name = next((value for value in headers if value in header_types), "")
        table_type = header_types.get(type_name, "")
        if not table_type and "コレクション" in headers and "種類" in headers:
            table_type = "Event collection"
        if not table_type:
            continue
        for row in re.findall(r"<tr.*?</tr>", part, flags=re.S):
            cells = re.findall(
                r"<(td|th)([^>]*)>(.*?)</\1>", row, flags=re.S | re.I
            )
            if not cells or any(cell[0].lower() == "th" for cell in cells):
                continue
            values = [strip_markup(cell[2]) for cell in cells]
            item_type = table_type
            if table_type == "Event collection":
                name_index = headers.index("コレクション")
                type_index = headers.index("種類")
                name = values[name_index] if name_index < len(values) else ""
                event_type = values[type_index] if type_index < len(values) else ""
                if event_type:
                    item_type = type_names.get(event_type, event_type)
                conditions = " / ".join(value for index, value in enumerate(values) if index != name_index)
                translation = ""
            else:
                name = values[0] if values else ""
                conditions = ""
                translation = ""
            if not name or name == type_name:
                continue
            if table_type == "Event collection":
                pass
            elif item_type == "Partner" and len(values) >= 3:
                translation = values[1]
                conditions = values[2]
            else:
                conditions = values[1] if len(values) > 1 else ""
            item_type = type_names.get(item_type, item_type)
            items.append(
                {
                    "type": item_type,
                    "name": name,
                    "translation": translation,
                    "conditions": conditions,
                    "english_condition": english_gloss(conditions),
                    "location": "",
                    "section": " / ".join(value for value in [family, section] if value),
                    "sources": [source_id],
                    "source_url": source_url,
                    "alternates": [],
                }
            )
    return items


def merge_collectibles(items: list[dict[str, object]]) -> list[dict[str, object]]:
    merged: dict[tuple[str, str], dict[str, object]] = {}
    for item in items:
        key = (item["type"], normalise(item["name"]))
        if not key[1]:
            continue
        if key not in merged:
            merged[key] = item
            continue
        current = merged[key]
        current["sources"] = sorted(set(current["sources"] + item["sources"]))
        current_alternates = current["alternates"]
        if (
            item["conditions"] != current["conditions"]
            or item["translation"] != current["translation"]
        ):
            alternate = {
                "conditions": item["conditions"],
                "english_condition": item["english_condition"],
                "translation": item["translation"],
                "section": item["section"],
                "source": item["sources"][0],
            }
            if alternate not in current_alternates:
                current_alternates.append(alternate)
    return list(merged.values())


def merge_titles(base_titles: list[dict[str, object]], additional_titles: list[dict[str, object]]) -> list[dict[str, object]]:
    index: dict[tuple[str, str], dict[str, object]] = {
        (normalise(title["title"]), title["tier"]): title for title in base_titles
    }
    for incoming in additional_titles:
        key = (normalise(incoming["title"]), incoming["tier"])
        if key not in index:
            base_titles.append(incoming)
            index[key] = incoming
            continue
        current = index[key]
        current["sources"] = sorted(set(current["sources"] + incoming["sources"]))
        alternate = {
            "description": incoming["description"],
            "category": incoming["category"],
            "source": incoming["sources"][0],
        }
        if alternate["description"] != current["description"] and alternate not in current["alternates"]:
            current["alternates"].append(alternate)
    return base_titles


def build() -> None:
    fandom = fetch_json(
        FANDOM_API,
        {
            "action": "parse",
            "page": FANDOM_PAGE,
            "prop": "text",
            "format": "json",
            "origin": "*",
        },
    )
    rendered_html = fandom["parse"]["text"]["*"]
    titles = parse_titles(rendered_html)

    additional_titles: list[dict[str, object]] = []
    for source_id, url in GAMERCH_TITLE_PAGES.items():
        additional_titles.extend(parse_gamerch_titles(fetch_html(url), source_id, url))
    titles = merge_titles(titles, additional_titles)

    fandom_collection = fetch_json(
        FANDOM_API,
        {
            "action": "parse",
            "page": FANDOM_COLLECTION_PAGE,
            "prop": "text",
            "format": "json",
            "origin": "*",
        },
    )
    collectibles = parse_collectibles(
        fandom_collection["parse"]["text"]["*"],
        "fandom-collection",
        "https://maimai-intl.fandom.com/wiki/Collection",
    )
    for source_id, url in GAMERCH_COLLECTION_PAGES.items():
        page_html = fetch_html(url)
        collectibles.extend(parse_gamerch_collectibles(page_html, source_id, url))
    collectibles = merge_collectibles(collectibles)

    jewels = fetch_json(JERRY_FRAMES_API)
    plates = fetch_json(JERRY_PLATES_API)

    def fetch_plate_songs(plate: dict[str, object]) -> dict[str, object]:
        plate = dict(plate)
        plate["charts"] = fetch_json(f"https://api.jerry.games/songs?version={plate['id']}")
        return plate

    with ThreadPoolExecutor(max_workers=8) as executor:
        plates = list(executor.map(fetch_plate_songs, plates))

    payload = {
        "builtAt": "2026-08-21",
        "titles": titles,
        "collectibles": collectibles,
        "jewels": jewels,
        "plates": plates,
        "sources": SOURCE_LIST,
    }
    DATA_PATH.write_text(
        "window.MAIMAI_CATALOG = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    added_titles = sum(1 for title in titles if title["added"])
    print(
        f"Wrote {len(titles)} titles ({added_titles} additions), "
        f"{len(collectibles)} collectibles, {len(jewels)} jewels, "
        f"and {len(plates)} plates to {DATA_PATH}"
    )


if __name__ == "__main__":
    build()
