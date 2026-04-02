import ast
import sys

def extract_routes(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read())
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                    if dec.func.attr == 'route':
                        if dec.args and isinstance(dec.args[0], ast.Constant):
                            print(f"{node.lineno}: {dec.args[0].value} -> {node.name}")

if __name__ == "__main__":
    extract_routes(sys.argv[1])
