import sys

# Read arguments from TypeScript
name = sys.argv[1] if len(sys.argv) > 1 else "Guest"
print(f"Hello, {name}! This is Python.")
