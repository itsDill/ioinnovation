#!/usr/bin/env python3
"""
Add Blog to the nav on all main pages that currently have:
  Home | Tools | Games | Guides
making it:
  Home | Tools | Games | Blog | Guides

The blog posts were already fixed by fix_nav_footer.py.
Main pages: the footer has /blog.html which fooled the earlier script.
"""
import os, glob, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# These already have Blog in their nav (blog posts + new tools - already fixed)
SKIP_PREFIXES = ('blog/', 'blog\\')
SKIP_NAMES = {'hub.html', 'analytics.html'}
# New calc tools already fixed
SKIP_NAMES_TOOLS = {'pe-ratio-calculator.html', 'compound-interest-calculator.html',
                    'dividend-yield-calculator.html', 'market-cap-calculator.html'}

# The nav section is between <nav and </nav>
# The Games→Guides transition in the nav (10-space indent)
# Handles Games being active or not
PATTERN = re.compile(
    r'(          <li><a href="/games\.html"[^>]*>Games</a></li>\n)'
    r'(          <li><a href="/guides\.html")',
    re.MULTILINE
)

REPLACEMENT = r'\1          <li><a href="/blog.html">Blog</a></li>\n\2'

updated = 0
for filepath in sorted(glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True)):
    rel = os.path.relpath(filepath, ROOT)
    fname = os.path.basename(filepath)

    # Skip already-fixed pages
    if any(rel.startswith(p) for p in SKIP_PREFIXES):
        continue
    if fname in SKIP_NAMES or fname in SKIP_NAMES_TOOLS:
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    # Only process if Blog is NOT already in the nav section
    # Extract nav section to check
    nav_match = re.search(r'<nav\b[^>]*>(.*?)</nav>', original, re.DOTALL)
    if nav_match:
        nav_content = nav_match.group(1)
        if '/blog.html' in nav_content:
            continue  # Already has Blog in nav

    new_content = PATTERN.sub(REPLACEMENT, original)

    if new_content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Updated: {rel}")
        updated += 1

print(f"\nDone. {updated} files updated.")
