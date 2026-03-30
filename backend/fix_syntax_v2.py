import os

path = r"c:\Users\mogan\b2b-marketplace\DealsDoubled.in\DealsDoubled.in\frontend\src\pages\SellerDashboard.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target block
target_start = "{enq.replies?.length > 0 && ("
target_end = "{/* Quick Reply Form */}"

import re

# We need to find the block between these markers and replace it
# But wait, there might be multiple occurrences? No, only one in Inquiries tab.
# Let's find the position of the start and end

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx != -1 and end_idx != -1:
    before = content[:start_idx]
    after = content[end_idx:]
    new_block = """{enq.replies?.length > 0 && (
                                <div className="space-y-4 mb-8">
                                   {enq.replies.map((reply, idx) => (
                                     <div key={idx} className="flex gap-4 pl-12">
                                        <div className="flex-1 bg-indigo-600 text-white p-4 rounded-3xl rounded-tl-none text-sm relative">
                                           <p>{reply.message}</p>
                                           <span className="absolute -top-2 left-0 text-[10px] font-bold text-indigo-400">{reply.seller_name} reply</span>
                                           <span className="block text-right text-[8px] text-white/60 mt-2">{new Date(reply.created_at).toLocaleTimeString()}</span>
                                        </div>
                                     </div>
                                   ))}
                                </div>
                              )}\n                              """
    new_content = before + new_block + after
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_content)
    print("Fixed!")
else:
    print(f"Not found! Start: {start_idx}, End: {end_idx}")
