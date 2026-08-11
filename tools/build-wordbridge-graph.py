"""Build a static semantic graph for Wordbridge from the Datamuse API.

Run once. Emits a compact JS file the page loads with a plain <script src>.
No runtime dependency on Datamuse, no backend, no build step on the site.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

API = "https://api.datamuse.com/words"
WORD_RE = re.compile(r"^[a-z]{3,12}$")

# Domains spread wide so the crawl does not collapse into one topic.
SEEDS = """
ocean sea river lake rain snow ice storm cloud wind desert forest mountain valley island beach
tree flower grass leaf root seed fruit apple bread cheese sugar salt coffee wine honey soup
dog cat horse bird fish snake bee spider wolf bear whale eagle mouse frog sheep
house door window roof floor wall garden kitchen bedroom church castle bridge tower factory school
city street road train car boat plane bicycle engine wheel tunnel harbor airport station
book paper pen letter word story poem music song guitar piano drum violin dance theatre
clock time morning night summer winter autumn spring hour year season yesterday
fire light shadow colour glass metal stone wood cloth rope wire glue paint mirror candle
money market shop price gold silver coin bank trade debt wealth
king queen soldier doctor teacher farmer sailor hunter thief priest artist judge
love fear anger joy sadness hope dream memory thought idea question answer truth lie secret
body hand foot eye ear heart blood bone brain skin voice breath sleep hunger
war peace law crime prison court army weapon knife arrow shield
science math number circle line angle atom energy gravity planet star moon sun space
computer phone screen camera radio television internet machine robot battery
food meal cooking recipe knife plate cup bottle spoon oven
sport game ball race running swimming climbing fishing hunting chess puzzle
family friend child mother father baby wedding birthday funeral village crowd
health medicine disease wound fever poison cure hospital
farm harvest field wheat corn milk egg wool leather
mind language writing reading school library museum history map
""".split()

CACHE = Path(__file__).parent / "datamuse_cache.json"
cache: dict[str, list] = {}
if CACHE.exists():
    cache = json.loads(CACHE.read_text())


def fetch(word: str, maximum: int = 100, rel: str = "ml") -> list:
    """rel="ml" is Datamuse "means like" (synonym-ish, tight). rel="trg" is
    "triggers" (statistical co-occurrence, loose/thematic — river -> flood,
    ocean -> wave). The two barely overlap, so blending both is what gets
    thematic chains like river -> ocean -> cloud to connect in a couple of
    hops instead of three or four synonym-only hops."""
    key = f"{rel}:{word}:{maximum}"
    if key in cache:
        return cache[key]
    param = "ml" if rel == "ml" else "rel_trg"
    q = urllib.parse.urlencode({param: word, "md": "fp", "max": maximum})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f"{API}?{q}", timeout=25) as r:
                data = json.load(r)
            cache[key] = data
            return data
        except Exception:
            if attempt == 3:
                return []
    return []


def fetch_blended(word: str, maximum: int = 100) -> list:
    """Union of means-like and triggers results, means-like entries first so
    ties in later rank-based scoring favour the tighter relationship."""
    ml = fetch(word, maximum, rel="ml")
    trg = fetch(word, maximum, rel="trg")
    seen = {e["word"] for e in ml}
    return ml + [e for e in trg if e["word"] not in seen]


def freq_of(entry: dict) -> float:
    for t in entry.get("tags", []):
        if t.startswith("f:"):
            try:
                return float(t[2:])
            except ValueError:
                return 0.0
    return 0.0


# Nouns that are grammatically fine but make dull, unguessable puzzle words:
# vague abstractions, quantities, and discourse filler.
STOPLIST = set("""
ability amount aspect basis case cause chance change choice class concept condition
context degree detail difference direction effect element example extent fact factor
feature form function idea instance issue item kind level lot manner matter means
method nature need number objective opposition order part pattern percent period place
point position possibility present principle problem process property purpose quality
quantity range rate reason reference regard relation respect result role scale sense
series set side situation sort stage state step structure subject system term theory
thing type unit use value variety view way whole
addition average basic component consideration content data date effort end event
experience fashion figure focus general group half increase index information input
interest lack limit line list main major minor mode note object option output
overall percentage phase piece plan practice presence rest return round rule
sample scope section segment share source specific standard status stock subset
success support target task total track trend trial version whereas
""".split())

# Datamuse's trigger data is corpus co-occurrence, so it surfaces whichever
# sense of a word is most common in text regardless of which sense a player
# means. "cloud" pulls in cloud computing, "apple" pulls in the company. This
# list exists only to knock out that kind of cross-domain pollution.
POLLUTION = set("""
saas apps app google amazon server backup storage infrastructure provider
computing software hardware startup ipad iphone macbook microsoft
""".split())

INFLECTION_SUFFIXES = (("ies", "y"), ("es", ""), ("s", ""), ("ing", ""), ("ed", ""))


def is_inflection(word: str, pool: set[str]) -> bool:
    """True if `word` is a plural or verb form of something already in `pool`."""
    for suffix, replacement in INFLECTION_SUFFIXES:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            stem = word[: -len(suffix)] + replacement
            if stem in pool:
                return True
            # doubled consonant, running -> run
            if len(stem) > 3 and stem[-1] == stem[-2] and stem[:-1] in pool:
                return True
            if suffix in ("ing", "ed") and stem + "e" in pool:
                return True
    return False


def acceptable(entry: dict) -> bool:
    w = entry.get("word", "")
    if not WORD_RE.match(w) or w in STOPLIST or w in POLLUTION:
        return False
    tags = entry.get("tags", [])
    if "prop" in tags or "n" not in tags:
        return False
    # Below ~0.4/million is too obscure to guess; above ~250 the word is so
    # generic it relates to everything and ruins the graph.
    f = freq_of(entry)
    return 0.4 <= f <= 250.0


def crawl_vocabulary(target_size: int) -> list[str]:
    """Seeds plus their direct neighbours, ranked by how many seeds point at them.

    Ranking on seed-cooccurrence rather than raw corpus frequency is what keeps
    the vocabulary in the concrete, picturable register the seeds define. Raw
    frequency drags it towards abstract nouns that make a poor word game.
    """
    seeds = [s for s in dict.fromkeys(SEEDS) if WORD_RE.match(s)]
    print(f"  {len(seeds)} seeds", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda w: (w, fetch_blended(w, 60)), seeds))

    hits: dict[str, int] = {}
    for _, entries in results:
        for e in entries:
            if acceptable(e):
                hits[e["word"]] = hits.get(e["word"], 0) + 1
    print(f"  {len(hits)} depth-1 candidates", file=sys.stderr)

    ranked = sorted(hits.items(), key=lambda kv: (-kv[1], kv[0]))
    vocab = list(seeds)
    pool_set = set(vocab)
    for word, _ in ranked:
        if len(vocab) >= target_size:
            break
        if word in pool_set or is_inflection(word, pool_set):
            continue
        vocab.append(word)
        pool_set.add(word)

    # Second sweep: seeds themselves may be inflections of each other.
    final = [w for w in vocab if not is_inflection(w, pool_set - {w})]
    print(f"  vocabulary {len(final)}", file=sys.stderr)
    return sorted(final)


def build_edges(vocab: list[str], top_n: int, keep_frac: float):
    index = {w: i for i, w in enumerate(vocab)}
    print(f"querying {len(vocab)} words for neighbours (means-like + triggers)", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda w: (w, fetch_blended(w, 100)), vocab))

    # Rank position is the only comparable signal Datamuse exposes, so turn it
    # into a 0..1 score. Both directions must agree: requiring reciprocity is
    # what filters out polysemy noise, where a rare sense of one word drags in
    # something unrelated to the sense a player has in mind.
    directed: dict[tuple[int, int], float] = {}
    for word, entries in results:
        a = index[word]
        hits = [e for e in entries if e.get("word") in index and e["word"] != word]
        for rank, e in enumerate(hits[:40]):
            directed[(a, index[e["word"]])] = 1.0 - (rank / 40.0)

    pair_score: dict[tuple[int, int], float] = {}
    for (a, b), s in directed.items():
        if a >= b:
            continue
        back = directed.get((b, a))
        if back is None:
            continue
        pair_score[(a, b)] = min(s, back)

    threshold = 0.0
    if pair_score:
        vals = sorted(pair_score.values(), reverse=True)
        threshold = vals[min(len(vals) - 1, int(len(vals) * keep_frac))]
    strong = {k: v for k, v in pair_score.items() if v >= threshold}
    print(f"  {len(pair_score)} candidate pairs, {len(strong)} above {threshold:.3f}", file=sys.stderr)

    # Cap the degree, mirroring Linxicon's top-5 rule. Without this the graph
    # becomes a hairball and every word connects to every other.
    by_node: dict[int, list] = {}
    for (a, b), s in strong.items():
        by_node.setdefault(a, []).append((s, b))
        by_node.setdefault(b, []).append((s, a))
    kept: dict[tuple[int, int], float] = {}
    for node, lst in by_node.items():
        lst.sort(reverse=True)
        for s, other in lst[:top_n]:
            key = (node, other) if node < other else (other, node)
            kept[key] = s
    print(f"  {len(kept)} edges after top-{top_n} cap", file=sys.stderr)
    return kept


def largest_component(n: int, edges: dict) -> set[int]:
    adj: dict[int, list[int]] = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)
    seen: set[int] = set()
    best: set[int] = set()
    for start in range(n):
        if start in seen or start not in adj:
            continue
        comp: set[int] = set()
        q = deque([start])
        seen.add(start)
        while q:
            cur = q.popleft()
            comp.add(cur)
            for nb in adj.get(cur, []):
                if nb not in seen:
                    seen.add(nb)
                    q.append(nb)
        if len(comp) > len(best):
            best = comp
    return best


def shortest_len(adj: dict[int, list[int]], a: int, b: int, cap: int = 9) -> int:
    if a == b:
        return 0
    seen = {a}
    frontier = [a]
    depth = 0
    while frontier and depth < cap:
        depth += 1
        nxt = []
        for cur in frontier:
            for nb in adj.get(cur, []):
                if nb == b:
                    return depth
                if nb not in seen:
                    seen.add(nb)
                    nxt.append(nb)
        frontier = nxt
    return -1


def main() -> None:
    vocab = crawl_vocabulary(1100)
    # Reciprocity already does the quality filtering, so keep every mutual pair
    # and let the per-node degree cap control density. 8 rather than 6: with
    # two data sources feeding candidates, a tighter cap was cutting off the
    # trigger-sourced thematic edges in favour of denser synonym clusters.
    edges = build_edges(vocab, top_n=8, keep_frac=1.0)

    comp = largest_component(len(vocab), edges)
    print(f"largest component: {len(comp)} of {len(vocab)} words", file=sys.stderr)
    remap = {old: i for i, old in enumerate(sorted(comp))}
    vocab = [vocab[old] for old in sorted(comp)]
    edges = {
        (remap[a], remap[b]): s
        for (a, b), s in edges.items()
        if a in remap and b in remap
    }

    adj: dict[int, list[int]] = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)

    # Endpoint pairs need a real gap: far enough apart to be interesting, close
    # enough to actually be bridgeable. Endpoints come only from the seed list,
    # so both ends are always concrete, picturable nouns rather than whatever
    # abstract noun the crawl happened to pull in.
    import random

    seed_set = {s for s in SEEDS}
    endpoints = [i for i, word in enumerate(vocab) if word in seed_set and len(adj.get(i, [])) >= 3]
    print(f"{len(endpoints)} candidate endpoints", file=sys.stderr)

    rng = random.Random(20260811)
    pairs = []
    seen_pairs = set()
    tries = 0
    while len(pairs) < 500 and tries < 200000:
        tries += 1
        a = rng.choice(endpoints)
        b = rng.choice(endpoints)
        if a == b or (min(a, b), max(a, b)) in seen_pairs:
            continue
        d = shortest_len(adj, a, b)
        if 3 <= d <= 6:
            seen_pairs.add((min(a, b), max(a, b)))
            pairs.append((a, b, d))
    print(f"{len(pairs)} playable pairs from {tries} tries", file=sys.stderr)

    flat_edges = []
    for (a, b), s in sorted(edges.items()):
        flat_edges.append(a)
        flat_edges.append(b)
        flat_edges.append(round(s * 1000))

    out = Path(sys.argv[1])
    payload = {
        "words": vocab,
        "edges": flat_edges,
        "pairs": [[a, b] for a, b, _ in pairs],
    }
    js = (
        "/* Wordbridge semantic graph. Generated offline from the Datamuse API\n"
        "   (https://api.datamuse.com), which exposes word-relatedness rankings.\n"
        "   Rebuild with tools/build-wordbridge-graph.py. Do not hand-edit.\n"
        "   words: vocabulary. edges: flat [a, b, score*1000] triples.\n"
        "   pairs: index pairs whose shortest path is 4-6 hops apart. */\n"
        "window.WORDBRIDGE_GRAPH = " + json.dumps(payload, separators=(",", ":")) + ";\n"
    )
    out.write_text(js)
    CACHE.write_text(json.dumps(cache))
    print(
        f"wrote {out} — {len(vocab)} words, {len(edges)} edges, "
        f"{len(pairs)} pairs, {len(js)/1024:.0f} KB",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
