#!/usr/bin/env python3
"""Add Guides to blog post nav where it's missing."""
import os, glob, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, 'blog')

# Also fix the 4 new calculator tools
TOOL_FILES = [
    os.path.join(ROOT, 'tools', 'pe-ratio-calculator.html'),
    os.path.join(ROOT, 'tools', 'compound-interest-calculator.html'),
    os.path.join(ROOT, 'tools', 'dividend-yield-calculator.html'),
    os.path.join(ROOT, 'tools', 'market-cap-calculator.html'),
]

def add_guides_to_nav(content, active_page='blog'):
    """Add Guides nav item after Blog nav item in the nav section."""
    # Extract just the nav section
    nav_match = re.search(r'(<nav\b[^>]*>.*?</nav>)', content, re.DOTALL)
    if not nav_match:
        return content
    nav_block = nav_match.group(1)

    # Already has guides? Skip
    if '/guides.html' in nav_block:
        return content

    # Find the Blog nav item and add Guides after it
    # Pattern: <li><a href="/blog.html"...>Blog</a></li>  followed by \n and spaces then </ul>
    # We need to detect the indentation used
    blog_li_match = re.search(r'( +)<li><a href="/blog\.html"[^>]*>Blog</a></li>', nav_block)
    if not blog_li_match:
        return content

    indent = blog_li_match.group(1)
    old_blog_line = blog_li_match.group(0)  # the full <li>...</li> with leading spaces
    new_block = old_blog_line + '\n' + indent + '<li><a href="/guides.html">Guides</a></li>'

    # Replace within the nav section only
    new_nav = nav_block.replace(old_blog_line, new_block, 1)
    content = content.replace(nav_block, new_nav, 1)
    return content

updated = 0
for filepath in sorted(glob.glob(os.path.join(BLOG_DIR, '*.html'))) + TOOL_FILES:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    # Check if Guides already in nav
    nav_match = re.search(r'<nav\b[^>]*>(.*?)</nav>', original, re.DOTALL)
    if nav_match and '/guides.html' in nav_match.group(1):
        continue

    content = add_guides_to_nav(original)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Updated: {os.path.relpath(filepath, ROOT)}")
        updated += 1

print(f"\nDone. {updated} files updated.")
