"use strict";

const lessonBaseUrl = "https://savanthchandra.github.io/python-daily/#concepts/ch";

const pythonPassages = [
  // =========================================================================
  // EASY (10 scripts — covering core Python foundations)
  // =========================================================================
  {
    file: "trip_budget.py",
    level: "easy",
    chapter: 2,
    logicLine: 6,
    text: `# Check whether a day trip fits within a shared budget.
travelers = 4
budget = 3200
bus_fare, lunch, ticket = 180, 240, 110

# Compute per-person and total group cost.
cost_per_person = bus_fare + lunch + ticket
group_cost = cost_per_person * travelers
money_left = budget - group_cost

print("Cost per person:", cost_per_person)
print("Group cost:", group_cost)

if money_left >= 0:
    print("Fits budget. Money left:", money_left)
else:
    print("Shortfall:", -money_left)

reserve = 500
if money_left - reserve >= 0:
    print("Reserve covered. Remaining:", money_left - reserve)
else:
    print("Not enough left for full reserve.")`
  },
  {
    file: "packing_checklist.py",
    level: "easy",
    chapter: 4,
    logicLine: 5,
    text: `# Track items to pack for a weekend trip.
needed = ["shirt", "toothbrush", "charger", "notebook"]
packed = ["shirt", "charger"]
missing = []

for item in needed:
    if item not in packed:
        missing.append(item)

print("Still needed:", ", ".join(missing))
packed.extend(missing)
packed.sort()

print("Final bag:")
for item in packed:
    print("-", item)

if len(packed) == len(needed):
    print("All", len(needed), "items packed.")`
  },
  {
    file: "daily_temperatures.py",
    level: "easy",
    chapter: 7,
    logicLine: 6,
    text: `# Count warm and cool temperature readings from one day.
readings = [19, 22, 25, 27, 26, 23, 21]
threshold = 24
total = 0
warm_count = 0

for temp in readings:
    total += temp
    if temp >= threshold:
        warm_count += 1
        print("Warm:", temp)
    else:
        print("Cool:", temp)

average = total / len(readings)
print("Warm count:", warm_count)
print("Average:", round(average, 1))
print("Range:", min(readings), "to", max(readings))`
  },
  {
    file: "cafe_receipt.py",
    level: "easy",
    chapter: 1,
    logicLine: 6,
    text: `# Print a rounded cafe receipt using the math module.
import math

items = [("Coffee", 140), ("Toast", 95), ("Cookie", 60)]
tax_rate = 0.05

subtotal = 0
for name, price in items:
    subtotal += price
    print(f"{name:<10} Rs {price}")

tax = math.ceil(subtotal * tax_rate)
total = subtotal + tax
print("-" * 18)
print(f"Subtotal   Rs {subtotal}")
print(f"Tax        Rs {tax}")
print(f"Total      Rs {total}")`
  },
  {
    file: "badge_formatter.py",
    level: "easy",
    chapter: 3,
    logicLine: 4,
    text: `# Clean attendee names and build event badge codes.
guests = ["  maya rao ", "leo ng", " zoey carter"]
event_code = "PY26"

for index, raw_name in enumerate(guests, start=1):
    clean = raw_name.strip().title()
    parts = clean.split()
    initials = "".join(word[0] for word in parts)
    badge = f"{event_code}-{index:02d}-{initials}"
    print(f"{clean:<14} -> {badge}")

print("Badges created:", len(guests))`
  },
  {
    file: "menu_lookup.py",
    level: "easy",
    chapter: 5,
    logicLine: 5,
    text: `# Look up menu prices safely using a dictionary.
prices = {"idli": 45, "dosa": 85, "tea": 25, "coffee": 35}
order = ["dosa", "tea", "tea", "juice"]

total = 0
for item in order:
    price = prices.get(item)
    if price is None:
        print(f"Unavailable: {item}")
    else:
        total += price
        print(f"Added {item}: {price}")

print("Order total:", total)`
  },
  {
    file: "ticket_pricing.py",
    level: "easy",
    chapter: 6,
    logicLine: 4,
    text: `# Determine museum ticket price from age and student status.
visitors = [("Asha", 9, False), ("Ravi", 21, True), ("Nikhil", 64, False)]

total_fare = 0
for name, age, is_student in visitors:
    if age < 12:
        fare = 50
        tier = "Child"
    elif is_student or age >= 60:
        fare = 100
        tier = "Concession"
    else:
        fare = 180
        tier = "Standard"
    total_fare += fare
    print(f"{name:<8} {tier:<11} Rs {fare}")

print("Total group fare:", total_fare)`
  },
  {
    file: "unit_converter.py",
    level: "easy",
    chapter: 8,
    logicLine: 3,
    text: `# Convert distance and temperature values with small functions.
trips_km = [3.5, 10.0, 21.1]

def km_to_miles(km):
    return km * 0.62137

def c_to_f(celsius):
    return celsius * 9 / 5 + 32

for km in trips_km:
    miles = km_to_miles(km)
    print(f"{km:>4.1f} km = {miles:.2f} mi")

for temp_c in [0, 25, 37]:
    print(f"{temp_c} C = {c_to_f(temp_c):.1f} F")`
  },
  {
    file: "note_buffer.py",
    level: "easy",
    chapter: 9,
    logicLine: 6,
    text: `# Read lines from an in-memory text buffer using a context manager.
import io

notes_text = "buy milk\\ncall mentor\\n# ignore draft\\nfinish lab\\n"

tasks = []
with io.StringIO(notes_text) as handle:
    for line_no, line in enumerate(handle, start=1):
        clean = line.strip()
        if clean and not clean.startswith("#"):
            tasks.append((line_no, clean))

for line_no, task in tasks:
    print(f"{line_no}. {task}")
print("Active tasks:", len(tasks))`
  },
  {
    file: "book_card.py",
    level: "easy",
    chapter: 10,
    logicLine: 1,
    text: `# Model library books with a small class and method.
class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages
        self.read = 0

    def log_pages(self, count):
        self.read = min(self.pages, self.read + count)

    def summary(self):
        pct = round(self.read / self.pages * 100)
        return f"{self.title}: {self.read}/{self.pages} ({pct}%)"

guide = Book("Think Python", 240)
guide.log_pages(96)
print(guide.summary())`
  },

  // =========================================================================
  // MEDIUM (10 scripts — core idioms, OOP, I/O & functional pipelines)
  // =========================================================================
  {
    file: "inventory_report.py",
    level: "medium",
    chapter: 5,
    logicLine: 9,
    text: `# Combine stock deliveries and sales into a category report.
movements = [
    ("notebook", "stationery", 12),
    ("blue pen", "stationery", 24),
    ("notebook", "stationery", -10),
    ("tea", "pantry", 16),
    ("tea", "pantry", -13),
]

stock = {}
item_categories = {}
for item, category, change in movements:
    stock[item] = stock.get(item, 0) + change
    item_categories[item] = category

category_totals = {}
reorder = []
for item, count in sorted(stock.items()):
    category = item_categories[item]
    category_totals[category] = category_totals.get(category, 0) + count
    if count < 5:
        reorder.append((item, count))

print("Inventory report")
for category, count in sorted(category_totals.items()):
    print(f"{category.title():>12}: {count:>3} units")

if reorder:
    print("Reorder alerts:")
    for item, count in reorder:
        print(f"  {item}: {count} left")`
  },
  {
    file: "running_splits.py",
    level: "medium",
    chapter: 7,
    logicLine: 8,
    text: `# Track runner lap times, three-lap splits, and the fastest lap.
lap_times = [79, 76, 78, 75, 77, 74, 72, 73, 71]
split_size = 3
split_times = []
running_total = 0
split_total = 0
fastest = None

for lap, seconds in enumerate(lap_times, start=1):
    running_total += seconds
    split_total += seconds
    if fastest is None or seconds < fastest[1]:
        fastest = (lap, seconds)

    mins, rem = divmod(running_total, 60)
    print(f"Lap {lap:02d}: {mins}:{rem:02d}")
    if lap % split_size == 0:
        split_times.append(split_total)
        split_total = 0

if split_total:
    split_times.append(split_total)

for idx, sec in enumerate(split_times):
    first = idx * split_size + 1
    last = min(first + split_size - 1, len(lap_times))
    print(f"Laps {first}-{last}: {sec}s")
print(f"Fastest: lap {fastest[0]} in {fastest[1]}s")`
  },
  {
    file: "trail_measurements.py",
    level: "medium",
    chapter: 1,
    logicLine: 13,
    text: `# Summarize a walking route with math and statistics.
import math
import statistics

stops = [
    ("Gate", (0, 0)),
    ("Pond", (90, 120)),
    ("Bridge", (215, 250)),
    ("Exit", (260, 310)),
]

segments = []
total = 0.0
for (start, pt_a), (end, pt_b) in zip(stops, stops[1:]):
    dist = math.dist(pt_a, pt_b)
    mins = math.ceil(dist / 72)
    segments.append((start, end, dist, mins))
    total += dist

lengths = [dist for _, _, dist, _ in segments]
longest = max(segments, key=lambda seg: seg[2])

print("Park walking route")
for start, end, dist, mins in segments:
    print(f"{start:>7} -> {end:<7} {dist:5.1f} m (~{mins} min)")

print(f"Total: {total:.1f} m | Mean leg: {statistics.mean(lengths):.1f} m")
print(f"Longest leg: {longest[0]} to {longest[1]}")`
  },
  {
    file: "build_schedule.py",
    level: "medium",
    chapter: 4,
    logicLine: 9,
    text: `# Sort workshop sessions and flag any overlapping blocks.
schedule = [
    (10, "Registration", 15),
    (30, "Design lab", 35),
    (75, "Break", 10),
    (90, "Review", 30),
]
extra = [(55, "Questions", 10), (65, "Demo", 10)]

agenda = schedule.copy()
agenda.extend(extra)
agenda.sort()

revised = [(start, start + mins, title) for start, title, mins in agenda]
overlaps = [
    (a[2], b[2]) for a, b in zip(revised, revised[1:]) if a[1] > b[0]
]

for start, end, title in revised:
    sh, sm = divmod(start, 60)
    eh, em = divmod(end, 60)
    print(f"{9 + sh}:{sm:02d}-{9 + eh}:{em:02d}  {title}")

if overlaps:
    for first, second in overlaps:
        print(f"Overlap: {first} & {second}")
else:
    print("No timing conflicts.")`
  },
  {
    file: "review_quiz_scores.py",
    level: "medium",
    chapter: 6,
    logicLine: 9,
    text: `# Grade quiz scores and average valid submissions.
scores = [
    ("Ana", 85),
    ("Ben", 58),
    ("Dina", 102),
    ("Eli", None),
    ("Farah", 96),
]

def assess(score):
    if score is None:
        return "Missing", "Submit quiz when ready."
    if not 0 <= score <= 100:
        return "Invalid", "Check entered score."
    if score >= 90:
        return "Excellent", "Try extension problem."
    if score >= 70:
        return "Good", "Review missed items."
    return "Pass", "Revisit worked examples."

valid = []
for name, score in scores:
    label, note = assess(score)
    print(f"{name:<7} {label:<10} {note}")
    if label not in {"Missing", "Invalid"}:
        valid.append(score)

if valid:
    print(f"Class average: {sum(valid) / len(valid):.1f}%")`
  },
  {
    file: "temperature_summary.py",
    level: "medium",
    chapter: 8,
    logicLine: 1,
    text: `# Format daily temperature summaries with small helper functions.
def to_fahrenheit(celsius):
    return celsius * 9 / 5 + 32

def mean(readings):
    return sum(readings) / len(readings) if readings else None

def present_range(label, readings):
    if not readings:
        return f"{label}: no data"
    low, high = min(readings), max(readings)
    avg = mean(readings)
    return (
        f"{label}: {low:.1f}-{high:.1f} C, "
        f"avg {avg:.1f} C ({to_fahrenheit(avg):.1f} F)"
    )

groups = {
    "Morning": [13.6, 14.1, 14.9],
    "Afternoon": [20.1, 21.8, 20.9],
    "Overnight": [],
}

for label, readings in groups.items():
    print(present_range(label, readings))

assert to_fahrenheit(0) == 32
assert mean([10, 20, 30]) == 20`
  },
  {
    file: "keyboard_characters.py",
    level: "medium",
    chapter: 3,
    logicLine: 7,
    text: `# Inspect US QWERTY character groups and punctuation counts.
examples = [
    "the quick brown fox jumps over the lazy dog",
    "PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS",
]
symbols = "!@#$%^&*()_-+=[]{}|;:'\\",.<>/?"

def ordered_unique(text):
    return "".join(sorted(set(text)))

groups = {
    "lower": examples[0].replace(" ", ""),
    "upper": examples[1].replace(" ", ""),
    "symbols": symbols,
}

for label, text in groups.items():
    unique = ordered_unique(text)
    print(f"{label:<8} {len(unique):>2}: {unique[:20]}")

assert ordered_unique(groups["lower"]) == ordered_unique(groups["upper"]).lower()
sample = 'Wait... did Maya say "yes", or "no"?'
for mark in (".", ",", "?", '"'):
    print(f"{mark!r}: {sample.count(mark)}")`
  },
  {
    file: "log_filter.py",
    level: "medium",
    chapter: 9,
    logicLine: 12,
    text: `# Parse log entries from StringIO and count severity levels.
import io

log_data = """INFO  09:01 Server started
WARN  09:04 Cache miss on key users
ERROR 09:05 Timeout connecting to worker
INFO  09:07 Retry succeeded
ERROR 09:11 Disk quota above 90%"""

counts = {"INFO": 0, "WARN": 0, "ERROR": 0}
alerts = []

with io.StringIO(log_data) as stream:
    for line in stream:
        level, stamp, message = line.strip().split(maxsplit=2)
        counts[level] = counts.get(level, 0) + 1
        if level in {"WARN", "ERROR"}:
            alerts.append(f"[{stamp}] {level}: {message}")

print("Counts:", counts)
for alert in alerts:
    print(alert)`
  },
  {
    file: "bank_account.py",
    level: "medium",
    chapter: 10,
    logicLine: 1,
    text: `# Model a simple bank account with deposits, withdrawals, and history.
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []

    def deposit(self, amount):
        if amount > 0:
            self.balance += amount
            self.history.append(("+", amount))

    def withdraw(self, amount):
        if 0 < amount <= self.balance:
            self.balance -= amount
            self.history.append(("-", amount))
            return True
        return False

    def statement(self):
        ops = ", ".join(f"{s}{v}" for s, v in self.history)
        return f"{self.owner}: Rs {self.balance} [{ops}]"

acct = BankAccount("Savanth", 500)
acct.deposit(350)
acct.withdraw(200)
print(acct.statement())`
  },
  {
    file: "functional_pipeline.py",
    level: "medium",
    chapter: 13,
    logicLine: 8,
    text: `# Transform and sort sensor readings with comprehensions and lambda.
samples = [
    ("lab-a", 22.4, True),
    ("lab-b", -99.0, False),
    ("lab-c", 26.8, True),
    ("lab-d", 19.5, True),
]

valid = [row for row in samples if row[2]]
fahrenheit = list(map(lambda r: (r[0], round(r[1] * 9 / 5 + 32, 1)), valid))
ranked = sorted(fahrenheit, key=lambda r: r[1], reverse=True)

summary = {name: temp for name, temp in ranked}
print("Valid sensors:", summary)
print("Warmest:", ranked[0][0], ranked[0][1], "F")
print("Filtered out:", len(samples) - len(valid))`
  },

  // =========================================================================
  // HARD (10 scripts — OOP inheritance, exceptions, generators & DSA)
  // =========================================================================
  {
    file: "clean_contact_list.py",
    level: "hard",
    chapter: 3,
    logicLine: 8,
    text: `# Parse and normalize unevenly spaced "name | team" contact entries.
entries = [
    "  maya  johnson | EVENTS ",
    "Leo Ng | tech",
    "zoey   carter | OPERATIONS",
    "  KAI DESAI | design ",
]

def normalize_name(raw_name):
    return " ".join(word.capitalize() for word in raw_name.split())

def create_handle(name):
    first, *rest = name.split()
    suffix = rest[-1][:3] if rest else ""
    return f"{first.lower()}.{suffix.lower()}".rstrip(".")

records = []
for raw_entry in entries:
    raw_name, sep, raw_team = raw_entry.partition("|")
    if not sep:
        continue
    name = normalize_name(raw_name)
    records.append((name, raw_team.strip().title(), create_handle(name)))

records.sort(key=lambda item: (item[1], item[0]))
print(f"{'Name':<18} {'Team':<12} Handle")
print("-" * 42)
for name, team, handle in records:
    print(f"{name:<18} {team:<12} @{handle}")`
  },
  {
    file: "read_expenses.py",
    level: "hard",
    chapter: 12,
    logicLine: 9,
    text: `# Parse raw expense rows safely without halting on malformed entries.
raw_rows = [
    "Bus fare, 40",
    "Lunch, 125.50",
    "Receipt total, unknown",
    "Refund, -20",
    "No amount here",
]

def read_amount(row):
    name, sep, amount = row.rpartition(",")
    if not sep or not name.strip():
        raise ValueError("Missing description or amount")
    return name.strip(), float(amount.strip())

items, errors = [], []
for line, row in enumerate(raw_rows, start=1):
    try:
        items.append(read_amount(row))
    except ValueError as err:
        errors.append((line, str(err)))

charges = [amt for _, amt in items if amt >= 0]
refunds = [-amt for _, amt in items if amt < 0]
for name, amt in items:
    print(f"{name:<16} {amt:>7.2f}")

print(f"Net: {sum(charges) - sum(refunds):.2f}")
for line, err in errors:
    print(f"Line {line} skipped: {err}")`
  },
  {
    file: "club_attendance.py",
    level: "hard",
    chapter: 5,
    logicLine: 10,
    text: `# Group club sign-ins by session, deduplicate names, and rank attendance.
records = [
    ("Tuesday", "Maya"),
    ("Tuesday", "Leo"),
    ("Tuesday", "Maya"),
    ("Thursday", "Zoey"),
    ("Thursday", "Leo"),
    ("Saturday", "Leo"),
]

def group_sessions(sign_ins):
    sessions = {}
    for day, name in sign_ins:
        sessions.setdefault(day, set()).add(name)
    return sessions

def rank_members(sessions):
    counts = {}
    for day, attendees in sessions.items():
        for name in attendees:
            counts.setdefault(name, set()).add(day)
    rows = [(name, len(days)) for name, days in counts.items()]
    return sorted(rows, key=lambda r: (-r[1], r[0])), counts

sessions = group_sessions(records)
leaders, member_days = rank_members(sessions)
regulars = set.intersection(*sessions.values()) if sessions else set()

print("Regulars:", ", ".join(sorted(regulars)) or "None")
for rank, (name, visits) in enumerate(leaders, start=1):
    print(f"{rank}. {name:<6} {visits} visits ({', '.join(sorted(member_days[name]))})")
assert len(member_days["Maya"]) == 1`
  },
  {
    file: "vector_cards.py",
    level: "hard",
    chapter: 11,
    logicLine: 3,
    text: `# Demonstrate inheritance and special dunder methods on 2D/3D vectors.
import math

class Vector2D:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def magnitude(self):
        return math.hypot(self.x, self.y)

    def __add__(self, other):
        return Vector2D(self.x + other.x, self.y + other.y)

    def __lt__(self, other):
        return self.magnitude() < other.magnitude()

    def __repr__(self):
        return f"Vector2D({self.x}, {self.y})"

class LabeledVector(Vector2D):
    def __init__(self, label, x, y):
        super().__init__(x, y)
        self.label = label

    def __repr__(self):
        return f"{self.label}: ({self.x}, {self.y}) | norm={self.magnitude():.2f}"

v1 = LabeledVector("Force A", 3, 4)
v2 = LabeledVector("Force B", 1, 2)
combined = v1 + v2
print(v1)
print(v2)
print("Sum:", combined, "norm:", round(combined.magnitude(), 2))`
  },
  {
    file: "safe_config_loader.py",
    level: "hard",
    chapter: 12,
    logicLine: 1,
    text: `# Validate key=value configuration lines with a custom exception class.
class ConfigError(ValueError):
    pass

def parse_config(lines):
    config = {}
    for line_no, raw in enumerate(lines, start=1):
        text = raw.strip()
        if not text or text.startswith("#"):
            continue
        if "=" not in text:
            raise ConfigError(f"Line {line_no}: missing '='")
        key, val = text.split("=", maxsplit=1)
        config[key.strip()] = int(val.strip()) if val.strip().isdigit() else val.strip()
    return config

raw_lines = ["host = localhost", "port = 8080", "workers = 4", "bad_line"]
try:
    settings = parse_config(raw_lines)
    print("Loaded:", settings)
except ConfigError as exc:
    print("Config rejected:", exc)
finally:
    print("Validation pass complete.")`
  },
  {
    file: "stream_aggregator.py",
    level: "hard",
    chapter: 13,
    logicLine: 12,
    text: `# Stream metrics with generators, itertools, and functools.reduce.
from functools import reduce
from itertools import islice

events = [
    ("api", 42),
    ("db", 118),
    ("api", 35),
    ("cache", 12),
    ("db", 95),
]

def slow_requests(rows, limit_ms=40):
    for service, ms in rows:
        if ms >= limit_ms:
            yield service, ms

top_two = list(islice(slow_requests(events), 2))
total_ms = reduce(lambda acc, item: acc + item[1], events, 0)

print("First slow events:", top_two)
print("Total latency:", total_ms, "ms")
print("Average:", round(total_ms / len(events), 1), "ms")`
  },
  {
    file: "recursive_folder_size.py",
    level: "hard",
    chapter: 8,
    logicLine: 10,
    text: `# Recursively compute total bytes across nested directory dictionaries.
tree = {
    "src": {
        "app.py": 4200,
        "utils": {"math.py": 1100, "fmt.py": 850},
    },
    "tests": {"test_app.py": 2300},
    "README.md": 640,
}

def folder_size(node):
    if isinstance(node, int):
        return node
    return sum(folder_size(child) for child in node.values())

def print_sizes(node, prefix=""):
    for name, child in sorted(node.items()):
        size = folder_size(child)
        tag = "/" if isinstance(child, dict) else ""
        print(f"{prefix}{name}{tag:<14} {size:>5} B")

print_sizes(tree)
print("Total bytes:", folder_size(tree))`
  },
  {
    file: "binary_search_range.py",
    level: "hard",
    chapter: 7,
    logicLine: 3,
    text: `# Find first and last index of a target in a sorted list via binary search.
nums = [2, 4, 4, 4, 7, 9, 11]

def find_bound(arr, target, find_first=True):
    low, high = 0, len(arr) - 1
    found = -1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            found = mid
            if find_first:
                high = mid - 1
            else:
                low = mid + 1
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return found

left = find_bound(nums, 4, True)
right = find_bound(nums, 4, False)
print("Target 4 span:", (left, right))
assert (left, right) == (1, 3)`
  },
  {
    file: "bracket_validator.py",
    level: "hard",
    chapter: 4,
    logicLine: 9,
    text: `# Check balanced brackets using a list stack and pair mapping.
samples = [
    "items = [a * (b + c)]",
    "matrix = ({[1, 2]})",
    "broken = ([1, 2)]",
]
pairs = {")": "(", "]": "[", "}": "{"}
openers = set(pairs.values())

def is_balanced(text):
    stack = []
    for ch in text:
        if ch in openers:
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack

for expr in samples:
    status = "OK" if is_balanced(expr) else "ERR"
    print(f"[{status}] {expr}")`
  },
  {
    file: "table_context_manager.py",
    level: "hard",
    chapter: 9,
    logicLine: 3,
    text: `# Format a CSV table inside a custom context manager.
import io

class TableReport:
    def __init__(self, headers):
        self.headers = headers
        self.buffer = io.StringIO()

    def __enter__(self):
        self.buffer.write(",".join(self.headers) + "\\n")
        return self

    def add_row(self, *values):
        self.buffer.write(",".join(str(v) for v in values) + "\\n")

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.csv = self.buffer.getvalue()
        self.buffer.close()
        return False

with TableReport(["Name", "Role", "Score"]) as report:
    report.add_row("Maya", "Lead", 94)
    report.add_row("Leo", "Dev", 88)

print(report.csv.strip())`
  }
];

const englishPassages = [
  // =========================================================================
  // EASY (5 passages — Narrative Flow Prose)
  // =========================================================================
  {
    file: "Morning at the market",
    level: "easy",
    text: `Maya took the long way to the market, past the blue bakery and the quiet square. The town was still waking up, but the market had been busy for an hour. A vendor carefully stacked apples in wooden crates, and someone at the next stall was trying to keep a sheet of paper from blowing into the road. Maya had brought an empty bag and a short list.

She usually bought the same things, so a small jar of ginger jam caught her attention. "Would you like to try it?" asked the vendor. He handed her a clean spoon and waited while she tasted it. The jam was warm and sharp, with just enough sweetness. Maya bought two jars, one for herself and one for her neighbor, who always left extra lemons by her door.

At the flower stall, she recognized a woman from the morning bus. They had seen each other nearly every weekday for a year and had never spoken. Today they talked about the rain, then about where they used to live. The woman had moved across town in spring and still took the longer bus because she liked watching the river on the way to work.

By the time Maya reached the bread stall, the sun had come over the roofs. She bought a loaf, checked off the last item, and found a seat near the fountain. She could have gone straight home, but the next bus was twenty minutes away. She tore off a piece of bread and stayed where she was, listening to the market fill up around her.`
  },
  {
    file: "A walk after the rain",
    level: "easy",
    text: `The rain stopped just before noon, leaving a thin line of water along the edge of every pavement. Leo put on his old shoes and went outside. He had planned to finish a book that morning, but after three chapters he knew he was reading the same paragraph without taking much in. A walk through the park seemed like a better use of the next hour.

At the gate he found a map he had never noticed. The wide path went straight to the lake. A thinner line turned past the playing fields, crossed a bridge, and ended near a stone wall. He took the smaller path because he wanted to find out what was on the other side. His shoes sank a little on the soft ground, and a blackbird waited on a branch until he had passed.

The bridge was barely wide enough for two people. An older man was leaning over the rail, watching the water move around a fallen branch. "It looks different after a storm," he said. Leo stopped beside him, and for a while they watched a leaf turn slowly in an eddy. Then the leaf broke free and floated beneath the bridge.

Beyond the wall there was a field with a single bench. Leo had walked past that part of the park for years without finding the path to it. He sat down and called his sister, who had lived nearby before she moved. She remembered the bench, and she told him to look for a date carved into its back. He found it near the left corner, half covered by a patch of moss.`
  },
  {
    file: "An evening workshop",
    level: "easy",
    text: `For the first ten minutes of the workshop, nothing seemed to fit. Zoey held one piece of wood against another and could not line up the corners. The instructor stopped beside her table and asked which side she was using as a guide. Zoey pointed to the short edge. "Try the longer one," he said, sliding the board around. The corners met as soon as she did.

She was building a small shelf for books and a few plants. At home, she had usually tried to get a job done quickly before putting the tools away. Here, an extra minute of measuring was part of the work. She marked two points with a pencil, checked them twice, and made the holes before turning the next piece over.

Across the room, two people were working on a bench. They took turns holding the ends while one of them tightened a screw. Nobody finished at the same time, and nobody seemed bothered by that. Every so often, someone asked for a second pair of hands. The instructor moved from table to table, offering a question or showing how a tool felt when it was held correctly.

The shelf was almost level when Zoey stood it up. One foot was a little high, and she spent several minutes sanding it down. When it stopped rocking, she set her water bottle on the top just to see that it would stay there. On the bus home, she held the shelf on her lap, already thinking about which corner of her room had the best light for a plant.`
  },
  {
    file: "The local library",
    level: "easy",
    text: `The library opened at nine, and Sam arrived before the door was unlocked. He had a book to return and a list of things to look up. His grandmother had talked about a shop on the corner of Green Street, and he wanted to see whether an old photograph showed it. She remembered the window and the green sign, but she could not remember the name.

The librarian pointed him toward a small cabinet near the stairs. Inside were paper folders sorted by street. Some pictures had notes on the back with dates and names. Others only showed a row of people or the side of a bus. Sam started with the oldest folder and moved forward a few years at a time.

Near the bottom of a folder marked 1974, he found a picture of workers repairing the road. Most of the frame showed a truck and a pile of stones. At the far right, just behind one of the workers, there was a narrow shopfront. The sign had been cut off in the picture, but the edge of the window looked like the one his grandmother had described.

He took a closer look with a magnifying glass and saw the first four letters of the name. The librarian found a street directory from the same year, and together they traced the names on the page until one matched. Sam wrote it down and made a copy of the photograph. Later, when he showed it to his grandmother, she remembered going there on Saturday mornings to buy paper bags of peppermints.`
  },
  {
    file: "The station clock",
    level: "easy",
    text: `Every evening at six, commuters gathered beneath the tall brass clock in the center of the concourse. Its minute hand jumped forward with a quiet click that you could hear whenever the platform announcements paused. Elena liked meeting her brother there because nobody ever needed to explain which corner of the hall they meant.

Tonight her train had arrived five minutes early, so she leaned against the iron railing and watched the crowd move toward the east exit. A boy balanced a cardboard box of pastries on one arm while reaching for his ticket with the other. Near the ticket booth, two musicians packed a violin case before heading down to the subway steps.

When her brother finally walked through the glass doors, he carried a folded map and two paper cups of hot tea. "The wind picked up right by the bridge," he said, handing her a cup. They stood under the clock for a moment to warm their hands before walking out into the bright street lights.`
  },

  // =========================================================================
  // MEDIUM (5 passages — Tech & Engineering Prose)
  // =========================================================================
  {
    file: "How hash tables stay fast",
    level: "medium",
    text: `A hash table stores key-value pairs so lookups take near-constant O(1) time on average. Instead of scanning every entry from start to finish, a hash function converts the key into an integer index inside a backing array. When two different keys map to the same slot, the table resolves the collision by probing nearby slots or chaining items together.

As more keys are inserted, the load factor (items divided by total slots) climbs steadily. Most runtimes automatically resize the array once the load factor crosses roughly 70%, allocating twice as many buckets and rehashing existing entries. Keeping dictionaries immutable in keys prevents subtle bugs when an object's hash changes after insertion.`
  },
  {
    file: "Designing for the home row",
    level: "medium",
    text: `Touch typing relies on muscle memory built from consistent anchor points. On a standard US QWERTY keyboard, small tactile bumps on the F and J keys let both index fingers locate the home row without looking down. From that neutral posture, every reach to the top number row or bottom punctuation keys stays short and predictable.

Good typing interfaces reinforce posture without distracting the eye. Subtle key highlights, zero-latency feedback on mistakes, and gentle dimming of surrounding controls allow a learner to keep rhythm steady across long passages. Accuracy always precedes speed: fixing an erratic habit at forty words per minute pays off forever.`
  },
  {
    file: "Inside the Python interpreter",
    level: "medium",
    text: `When you run a Python script, the interpreter does not execute raw source text line by line in isolation. First, it parses the file into an abstract syntax tree (AST) and compiles those nodes into compact bytecode instructions. That bytecode runs inside a stack-based virtual machine written in C (CPython), which manages frames, objects, and reference counts.

Because variables in Python are references to heap objects rather than fixed memory boxes, a single list can hold numbers, strings, and nested dictionaries side by side. Understanding this model explains why list aliasing (b = a) shares mutations while shallow copies (a.copy()) allocate a new outer container.`
  },
  {
    file: "Version control and small commits",
    level: "medium",
    text: `Writing clean code is half architecture and half commit hygiene. Rather than bundling three unrelated features and a style refactor into one giant commit, experienced engineers slice changes into self-contained steps. Each commit compiles cleanly, passes tests on its own, and tells a clear story in the git log.

When a regression shows up weeks later, bisecting small commits isolates the faulty change in seconds instead of hours. Pairing concise commit subjects with short descriptions of why an invariant changed makes code reviews faster for teammates and future maintainers alike.`
  },
  {
    file: "Latency versus throughput",
    level: "medium",
    text: `Latency measures how long a single request takes from start to finish, whereas throughput measures how many requests a system finishes per second. Optimizing one does not automatically improve the other. Batching writes onto a disk raises throughput dramatically, for example, yet adds waiting time for the earliest item in each batch.

Before tuning a service, engineers measure tail latency (such as p95 and p99 response times) alongside average throughput. Caching hot reads in memory cuts round trips, while asynchronous queues smooth sudden traffic spikes without dropping incoming work.`
  },

  // =========================================================================
  // HARD (5 passages — Symbols, Numbers, Quotes & Punctuation)
  // =========================================================================
  {
    file: "Release notes v2.4.0",
    level: "hard",
    text: `Build v2.4.0-rc3 (released 2026-11-18) cuts p99 API latency by 38.4% -- dropping from 142ms down to 87.5ms under 1,250 req/s load. Two critical flags changed: "--max-workers=8" now defaults to auto-scaling [2..16], and "CACHE_TTL_SEC" moved from 300s to 900s!

Breaking note: endpoints under "/api/v1/legacy/*" return HTTP 410 (Gone) starting 2027-01-01; migrate callers to "/api/v2/sessions/{id}". Full checksums (SHA-256) and migration scripts live in "docs/upgrade_v24.md" -- verify signatures before deploying.`
  },
  {
    file: "Lab notebook: run #42",
    level: "hard",
    text: `Trial #42 (ambient 24.6 C; pressure 101.3 kPa): mixed 12.50 mL of 0.15M NaCl with 8.75 mL reagent "B-19" at t = 00:00. After 45s of stirring (600 rpm), pH stabilized at 6.82 +/- 0.03, matching the predicted curve within 1.8%.

Note: sensor #3 drifted +0.14V between 120s and 180s -- re-zero channel [A0:A3] before Trial #43! Save raw CSV exports as "run_042_2026-11-22.csv" (UTF-8, comma-delimited) and verify no NaN rows remain.`
  },
  {
    file: "API incident postmortem",
    level: "hard",
    text: `At 03:14 UTC, worker pool "eu-west-2a" hit 99.7% memory utilization after a malformed payload ("user_id": null, "items": []) triggered an infinite retry loop. Error rate jumped from 0.02% to 14.6% across 4,820 active sessions; circuit breakers tripped 90s later.

Action items: (1) enforce schema validation at edge ingress ("status: 422"); (2) cap exponential backoff at 30s with +/- 25% jitter; (3) add alert rule "mem_pct > 82% for 2m" to #ops-oncall.`
  },
  {
    file: "Financial ledger audit",
    level: "hard",
    text: `Q3 reconciliation summary (FY2026): gross revenue totaled $148,920.50 (+12.4% YoY), while infrastructure spend came in at $19,340.18 -- roughly 13.0% of top-line receipts. Invoice #INV-8841 ($2,450.00) remains marked "PENDING_NET30"; follow up with billing@vendor.io by Friday.

Tax reserve (22.5%) equals $33,507.11; net retained margin stands at $96,073.21. Export signed PDF ("Q3_Audit_Final.pdf") and lock ledger permissions to [read-only] prior to board review.`
  },
  {
    file: "Interview dialogue on debugging",
    level: "hard",
    text: `"Wait -- why did line 47 return None instead of [0, 1]?" asked Priya, pointing at the traceback. "Look closely at sort(): it mutates in-place and returns None; you wanted sorted(items, key=lambda x: x[1])!" replied Arun.

"Aha! That explains KeyError: '0' in step #2," she laughed, typing Ctrl+S to re-run pytest. Two seconds later, all 18/18 assertions passed (0.04s) -- clean green output at last.`
  }
].map(exercise => ({ ...exercise, kind: "english" }));

const codingPassages = pythonPassages.map(exercise => ({ ...exercise, kind: "python" }));

function detectLogicStartLine(source) {
  const lines = source.split("\n");
  let i = 0;
  let bracketDepth = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (bracketDepth > 0) {
      for (const ch of trimmed) {
        if (ch === "[" || ch === "{" || ch === "(") bracketDepth++;
        else if (ch === "]" || ch === "}" || ch === ")") bracketDepth--;
      }
      i++;
      continue;
    }
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
      i++;
      continue;
    }
    if (/^[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*=\s*/.test(trimmed) && !trimmed.includes("(")) {
      for (const ch of trimmed) {
        if (ch === "[" || ch === "{" || ch === "(") bracketDepth++;
        else if (ch === "]" || ch === "}" || ch === ")") bracketDepth--;
      }
      i++;
      continue;
    }
    if (/^[A-Za-z_]\w*\s*=\s*(?:"""|''')/.test(trimmed)) {
      const quote = trimmed.includes('"""') ? '"""' : "'''";
      const first = trimmed.indexOf(quote);
      const second = trimmed.indexOf(quote, first + 3);
      i++;
      if (second === -1) {
        while (i < lines.length && !lines[i].includes(quote)) i++;
        if (i < lines.length) i++;
      }
      continue;
    }
    break;
  }
  return Math.min(i, Math.max(0, lines.length - 1));
}

let proceduralCounter = 0;

function generateRandomDrill({ kind = "python", level = "medium", missedKeys = [] } = {}) {
  proceduralCounter += 1;
  const cleanedMissed = [...new Set(
    missedKeys.filter(ch => typeof ch === "string" && ch.length === 1 && ch !== "\n" && ch !== " ")
  )].slice(0, 6);

  if (cleanedMissed.length > 0) {
    const labelList = cleanedMissed.join(" ");
    if (kind === "python") {
      const hasBrackets = cleanedMissed.some(c => "[](){}".includes(c));
      const hasSymbols = cleanedMissed.some(c => "_:=+-*/%<>&|!@#".includes(c));
      const safeTag = cleanedMissed.map(c => (c === '"' ? "'" : c === "\\" ? "/" : c)).join("");
      const text = [
        `# Targeted drill for missed keys: ${safeTag}`,
        `targets = [${cleanedMissed.map(c => JSON.stringify(c)).join(", ")}]`,
        `scores = {ch: idx * 10 + 5 for idx, ch in enumerate(targets)}`,
        hasBrackets
          ? `pairs = [(k, [v, v // 2]) for k, v in sorted(scores.items())]`
          : `pairs = [(k, v) for k, v in sorted(scores.items())]`,
        hasSymbols
          ? `total = sum(v for _, v in scores.items()) + (len(targets) % 3)`
          : `total = sum(scores.values())`,
        `for key, val in pairs:`,
        `    print(f"Key {key!r}: score={val}")`,
        `print(f"Drill total ({len(targets)} keys): {total}")`
      ].join("\n");
      return {
        file: `drill_missed_${proceduralCounter}.py`,
        level,
        chapter: 5,
        kind: "python",
        isDrill: true,
        logicLine: 2,
        text
      };
    }

    const wordsByChar = {
      a: "accurate", b: "balance", c: "compact", d: "design", e: "every",
      f: "finger", g: "gentle", h: "habit", i: "index", j: "jump",
      k: "keyboard", l: "layout", m: "memory", n: "normal", o: "order",
      p: "practice", q: "quick", r: "rhythm", s: "steady", t: "typing",
      u: "until", v: "value", w: "window", x: "exact", y: "yearly", z: "zero"
    };
    const pickedWords = cleanedMissed.map(ch => wordsByChar[ch.toLowerCase()] || `"${ch}"`);
    const p1 = `Focused recovery drill for ${labelList}: keep both index fingers anchored on F and J while striking ${pickedWords.join(", ")} with clean posture and steady rhythm.`;
    const p2 = `Repeat each sequence (${pickedWords.slice(0, 3).join(" / ")}) calmly rather than rushing; accurate reaches build lasting speed across every session.`;
    return {
      file: `Missed keys drill (${cleanedMissed.slice(0, 4).join(" ")})`,
      level,
      kind: "english",
      isDrill: true,
      text: `${p1}\n\n${p2}`
    };
  }

  // Procedural non-repeating Python or English drill for Random mode
  if (kind === "python") {
    const seed = (proceduralCounter * 7 + Date.now()) % 4;
    const templates = [
      () => {
        const items = ["\"apple\", 3", "\"bread\", 2", "\"milk\", 4", "\"tea\", 1"];
        return [
          `# Procedural drill #${proceduralCounter}: inventory tally`,
          `cart = [${items.join("), (")}]`.replace("cart = [", "cart = [(").replace("]", ")]"),
          `totals = {}`,
          `for name, qty in cart:`,
          `    totals[name] = totals.get(name, 0) + qty`,
          `for item, count in sorted(totals.items()):`,
          `    print(f"{item:<8} x{count}")`,
          `print("Distinct items:", len(totals))`
        ].join("\n");
      },
      () => [
        `# Procedural drill #${proceduralCounter}: temperature filter`,
        `readings = [18, 24, 29, 21, 31, 25]`,
        `warm = [t for t in readings if t >= 25]`,
        `avg = sum(readings) / len(readings)`,
        `print(f"Warm readings: {warm}")`,
        `print(f"Mean temp: {avg:.1f} C ({len(warm)} warm)")`
      ].join("\n"),
      () => [
        `# Procedural drill #${proceduralCounter}: tag counter`,
        `tags = ["py", "web", "py", "cli", "web", "py"]`,
        `counts = {}`,
        `for tag in tags:`,
        `    counts[tag] = counts.get(tag, 0) + 1`,
        `ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))`,
        `for name, total in ranked:`,
        `    print(f"#{name:<5} -> {total}")`
      ].join("\n"),
      () => [
        `# Procedural drill #${proceduralCounter}: batch summary`,
        `durations = [12.4, 9.8, 15.1, 11.2]`,
        `def stats(values):`,
        `    return min(values), max(values), sum(values) / len(values)`,
        `low, high, mean = stats(durations)`,
        `print(f"Min: {low:.1f}s | Max: {high:.1f}s | Avg: {mean:.1f}s")`
      ].join("\n")
    ];
    return {
      file: `procedural_drill_${proceduralCounter}.py`,
      level,
      chapter: 5,
      kind: "python",
      isDrill: true,
      logicLine: 2,
      text: templates[seed]()
    };
  }

  const subjects = ["engineers", "designers", "musicians", "students"];
  const actions = ["practice deliberate scales", "review concise notes", "measure daily progress", "refine small habits"];
  const s = subjects[proceduralCounter % subjects.length];
  const a = actions[(proceduralCounter + 1) % actions.length];
  return {
    file: `Procedural drill #${proceduralCounter}`,
    level,
    kind: "english",
    isDrill: true,
    text: `Skilled ${s} ${a} before tackling larger projects. By isolating tricky transitions and checking every detail early, steady accuracy replaces rushed guesswork.\n\nKeep your wrists relaxed, stay anchored on the home row, and let each clean keystroke carry your momentum into the next line.`
  };
}
