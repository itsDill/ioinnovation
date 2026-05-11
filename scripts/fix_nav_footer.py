#!/usr/bin/env python3
"""
Fix nav and footer consistency across all site HTML files.

Changes:
1. Standardize nav to: Home | Tools | Games | Blog | Guides
   - Pages missing Blog: insert Blog before Guides
   - Blog posts missing Guides: insert Guides after Blog
   - Fix blog.html's active class (was on Guides, should be Blog)
2. Update blog post footers to include new calculator tools
"""
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 1. NAV PATTERNS ──────────────────────────────────────────────────────────

# Pattern for pages that have Guides but NOT Blog in nav
# e.g. <li><a href="/guides.html">Guides</a></li>  (with possible class="active")
GUIDES_NO_BLOG = re.compile(
    r'(\s*<li><a href="/games\.html"[^>]*>Games</a></li>\s*\n)'
    r'(\s*<li><a href="/guides\.html")',
    re.MULTILINE
)

# Pattern for pages that have Blog but NOT Guides in nav
# e.g. <li><a href="/blog.html" class="active">Blog</a></li>  followed by </ul>
BLOG_NO_GUIDES = re.compile(
    r'(\s*<li><a href="/blog\.html"[^>]*>Blog</a></li>)\s*\n'
    r'(\s*</ul>)',
    re.MULTILINE
)

def indent_of(line):
    return len(line) - len(line.lstrip())

def fix_nav(content, filepath):
    rel = os.path.relpath(filepath, ROOT)
    is_blog_post = rel.startswith('blog' + os.sep)
    is_new_tool = any(rel == f'tools/{t}' for t in [
        'pe-ratio-calculator.html', 'compound-interest-calculator.html',
        'dividend-yield-calculator.html', 'market-cap-calculator.html'
    ])

    # Detect what's currently in the nav
    has_blog_nav = bool(re.search(r'href="/blog\.html"', content))
    has_guides_nav = bool(re.search(r'href="/guides\.html"', content))

    if is_blog_post or is_new_tool:
        # These have Blog but not Guides — add Guides after Blog nav item
        if has_blog_nav and not has_guides_nav:
            content = BLOG_NO_GUIDES.sub(
                lambda m: m.group(1) + '\n' + re.sub(r'\S.*', '', m.group(1)) + '<li><a href="/guides.html">Guides</a></li>\n' + m.group(2),
                content
            )
    else:
        # Main pages have Guides but not Blog — add Blog before Guides nav item
        if has_guides_nav and not has_blog_nav:
            content = GUIDES_NO_BLOG.sub(
                lambda m: m.group(1) + re.sub(r'\S.*', '', m.group(2)) + '<li><a href="/blog.html">Blog</a></li>\n' + m.group(2),
                content
            )

    return content

# ── 2. FIX blog.html active class (Guides active → Blog active) ───────────────

def fix_blog_html_active(content):
    # blog.html nav: Guides is marked active but should be Blog
    # Remove active from Guides, add active to Blog
    content = content.replace(
        '<li><a href="/blog.html">Blog</a></li>',
        '<li><a href="/blog.html" class="active">Blog</a></li>'
    )
    content = content.replace(
        '<li><a href="/guides.html" class="active">Guides</a></li>',
        '<li><a href="/guides.html">Guides</a></li>'
    )
    return content

# ── 3. BLOG FOOTER: add new calculator tools ─────────────────────────────────

OLD_FOOTER_TOOLS = re.compile(
    r'(<li><a href="/tools/13f-visualizer\.html">13F Visualizer</a></li>\s*\n'
    r'\s*<li><a href="/tools/10k-summary\.html">10-K Summary</a></li>\s*\n'
    r'\s*<li><a href="/tools\.html">All Tools</a></li>)',
    re.MULTILINE
)

NEW_FOOTER_TOOLS = (
    '<li><a href="/tools/13f-visualizer.html">13F Visualizer</a></li>\n'
    '                <li><a href="/tools/10k-summary.html">10-K Summary</a></li>\n'
    '                <li><a href="/tools/pe-ratio-calculator.html">P/E Calculator</a></li>\n'
    '                <li><a href="/tools/compound-interest-calculator.html">Compound Interest</a></li>\n'
    '                <li><a href="/tools/dividend-yield-calculator.html">Dividend Calculator</a></li>\n'
    '                <li><a href="/tools/market-cap-calculator.html">Market Cap Calc</a></li>\n'
    '                <li><a href="/tools.html">All Tools</a></li>'
)

def fix_footer_tools(content):
    return OLD_FOOTER_TOOLS.sub(NEW_FOOTER_TOOLS, content)

# ── MAIN ──────────────────────────────────────────────────────────────────────

all_html = glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True)
# Skip hub.html (deleted), analytics.html (special page)
skip = {'hub.html', 'analytics.html'}

nav_fixed = 0
footer_fixed = 0
blog_active_fixed = False

for filepath in sorted(all_html):
    fname = os.path.basename(filepath)
    if fname in skip:
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    # Fix nav
    content = fix_nav(content, filepath)

    # Fix blog.html active class
    if fname == 'blog.html':
        content = fix_blog_html_active(content)
        if content != original:
            blog_active_fixed = True

    # Fix blog post footers (blog posts and pre-existing ones)
    rel = os.path.relpath(filepath, ROOT)
    if rel.startswith('blog' + os.sep):
        new_content = fix_footer_tools(content)
        if new_content != content:
            footer_fixed += 1
        content = new_content

    if content != original:
        nav_fixed += 1
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Updated: {os.path.relpath(filepath, ROOT)}")

print(f"\nDone. {nav_fixed} files updated (footers: {footer_fixed}).")
