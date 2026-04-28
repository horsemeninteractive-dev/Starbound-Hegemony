import sys

with open('src/galaxy/components/StarVisual.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the WhiteHole part
target = """      uniform float uInnerR;
      uniform float uOuterR;"""
replacement = """      uniform float uInnerR;
      uniform float uOuterR;
      uniform float uDetailed;
      uniform float uQuality;"""

if target in content:
    content = content.replace(target, replacement, 1)
    with open('src/galaxy/components/StarVisual.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    # Try with \r\n
    target = target.replace('\n', '\r\n')
    replacement = replacement.replace('\n', '\r\n')
    if target in content:
        content = content.replace(target, replacement, 1)
        with open('src/galaxy/components/StarVisual.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Success (with CRLF)")
    else:
        print("Target not found")
        # Print a bit of the file for debugging
        idx = content.find("uniform float uOuterR;")
        if idx != -1:
            print(f"Found at {idx}: {repr(content[idx:idx+50])}")
