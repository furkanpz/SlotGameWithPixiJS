import json
from math import comb, floor, ceil


with open("forModels.json", "r", encoding="utf-8") as f:
    data = json.load(f)


rows = 5
cols = 5
grid_size = rows * cols  


total_elements = sum(len(seq) for seq in data["default"])
total_ones = sum(seq.count("1") for seq in data["default"])


p_single = total_ones / total_elements


def prob_at_least_k(p, n, k):
    prob = 0
    for i in range(k):
        prob += comb(n, i) * (p**i) * ((1-p)**(n-i))
    return 1 - prob

current_prob = prob_at_least_k(p_single, grid_size, 3)
target_prob = min(current_prob * 4, 1.0)

print(f"Mevcut olasılık (en az 3 '1'): {current_prob:.4f}")
print(f"Hedef olasılık (4 katı): {target_prob:.4f}")


def find_new_p(target_prob, n, k):
    p = 0.0
    step = 0.0001
    while p <= 1.0:
        if prob_at_least_k(p, n, k) >= target_prob:
            return p
        p += step
    return 1.0

new_p = find_new_p(target_prob, grid_size, 3)
print(f"Gerekli tek slot olasılığı: {new_p:.4f}")


total_needed_ones = new_p * total_elements - total_ones
print(f"Toplam eklenmesi gereken '1' sayısı (yaklaşık): {ceil(total_needed_ones)}")


weights = [len(seq)/total_elements for seq in data["default"]]
y_float = [total_needed_ones * w for w in weights]


y_int = [floor(val) for val in y_float]
remainder = round(total_needed_ones - sum(y_int))

fractions = [val - floor(val) for val in y_float]
indices_sorted = sorted(range(len(fractions)), key=lambda i: fractions[i], reverse=True)

for i in range(remainder):
    y_int[indices_sorted[i]] += 1


for idx, seq in enumerate(data["default"]):
    print(f"Dizi {idx}: Mevcut '1' sayısı = {seq.count('1')}, Eklenecek '1' sayısı = {y_int[idx]}")


new_total_ones = total_ones + sum(y_int)
new_total_elements = total_elements + sum(y_int)
new_prob = new_total_ones / new_total_elements
print(f"\nToplam olasılık tek slot bazında: {new_prob:.4f}")
