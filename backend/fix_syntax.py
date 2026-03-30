import os

path = r"c:\Users\mogan\b2b-marketplace\DealsDoubled.in\DealsDoubled.in\frontend\src\pages\SellerDashboard.js"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
found = False
for line in lines:
    if "Quick Reply Form" in line and ")} {" in line:
        # Replacement for line 731
        new_lines.append("                              )}\n")
        new_lines.append("                              {/* Quick Reply Form */}\n")
        found = True
    else:
        new_lines.append(line)

if found:
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.writelines(new_lines)
    print("Fixed!")
else:
    print("Not found!")
