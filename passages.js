"use strict";

const lessonBaseUrl = "https://savanthchandra.github.io/python-daily/#concepts/ch";

const passages = [
  {
    file: "inventory_report.py",
    chapter: 5,
    text: `# Build an inventory report from a list of stock movements.
movements = [
    ("notebook", "stationery", 12),
    ("blue pen", "stationery", 24),
    ("notebook", "stationery", -10),
    ("tea", "pantry", 16),
    ("coffee", "pantry", 8),
    ("tea", "pantry", -13),
]

# Dictionaries track quantities and categories by item.
stock = {}
item_categories = {}
categories = set()

for item, category, change in movements:
    stock[item] = stock.get(item, 0) + change
    item_categories[item] = category
    categories.add(category)

# Group the totals and collect items that need attention.
category_totals = {category: 0 for category in categories}
reorder = []

for item, count in sorted(stock.items()):
    category = item_categories[item]
    category_totals[category] += count
    if count < 5:
        reorder.append((item, count))

# Print one line for each category, followed by the alert list.
print("Inventory report")
for category, count in sorted(category_totals.items()):
    print(f"{category.title():>12}: {count:>3} units")

if reorder:
    print("Order more of these items:")
    for item, count in reorder:
        print(f"  {item}: only {count} left")
else:
    print("All stock levels are healthy.")`
  },
  {
    file: "running_splits.py",
    chapter: 7,
    text: `# Report lap times for a runner, with splits every three laps.
lap_times = [79, 76, 78, 75, 77, 74, 72, 73, 71]
split_size = 3
split_times = []
running_total = 0
split_total = 0
fastest_lap = None

# Use a loop to update the running totals after each lap.
for lap, seconds in enumerate(lap_times, start=1):
    running_total += seconds
    split_total += seconds

    if fastest_lap is None or seconds < fastest_lap[1]:
        fastest_lap = (lap, seconds)

    minutes, remainder = divmod(running_total, 60)
    print(f"Lap {lap:02d}: {minutes}:{remainder:02d}")

    # Save each complete split and reset its subtotal.
    if lap % split_size == 0:
        split_times.append(split_total)
        split_total = 0

# Include the remaining laps if the last split was incomplete.
if split_total:
    split_times.append(split_total)

print("Split times:")
for index in range(len(split_times)):
    first_lap = index * split_size + 1
    last_lap = min(first_lap + split_size - 1, len(lap_times))
    seconds = split_times[index]
    print(f"  Laps {first_lap}-{last_lap}: {seconds}s")

if fastest_lap is not None:
    lap, seconds = fastest_lap
    print(f"Fastest lap: {lap} in {seconds}s")`
  },
  {
    file: "trail_measurements.py",
    chapter: 1,
    text: `# Use standard library modules to summarize a walking route.
import math
import statistics

# Each point is an east and north coordinate in meters.
stops = [
    ("Gate", (0, 0)),
    ("Pond", (90, 120)),
    ("Lookout", (155, 170)),
    ("Bridge", (215, 250)),
    ("Exit", (260, 310)),
]

segments = []
total = 0.0

# math.dist calculates the straight-line length of each leg.
for (start, point_a), (end, point_b) in zip(stops, stops[1:]):
    distance = math.dist(point_a, point_b)
    minutes = math.ceil(distance / 72)
    segments.append((start, end, distance, minutes))
    total += distance

# The statistics module handles the average leg length.
lengths = [distance for _, _, distance, _ in segments]
average = statistics.mean(lengths)
longest = max(segments, key=lambda segment: segment[2])

# Estimate water stops using distance markers on the route.
water_intervals = [100, 200, 300]
covered = 0.0
water_stops = []

for start, end, distance, _ in segments:
    finish_distance = covered + distance
    for marker in water_intervals:
        if covered < marker <= finish_distance:
            water_stops.append((marker, start, end))
    covered = finish_distance

print("Park walking route")
print("=" * 32)
for start, end, distance, minutes in segments:
    print(f"{start:>8} to {end:<8} {distance:6.1f} m")
    print(f"  Allow about {minutes} minutes.")

print(f"Total distance: {total:.1f} meters")
print(f"Typical leg: {average:.1f} meters")
print(f"Longest leg: {longest[0]} to {longest[1]}")

if water_stops:
    print("Suggested water stops:")
    for marker, start, end in water_stops:
        print(f"  At {marker} m, between {start} and {end}.")`
  },
  {
    file: "clean_contact_list.py",
    chapter: 3,
    text: `# Turn unevenly spaced contact entries into display labels.
entries = [
    "  maya  johnson | EVENTS ",
    "Leo Ng | tech",
    "zoey   carter | OPERATIONS",
    "  KAI DESAI | design ",
    "Sam   Flores | TECH  ",
]

def normalize_name(raw_name):
    # split without an argument also handles repeated spaces.
    words = raw_name.split()
    return " ".join(word.capitalize() for word in words)

def create_handle(name):
    first, *rest = name.split()
    # Take up to three characters from the final name.
    suffix = rest[-1][:3] if rest else ""
    return f"{first.lower()}.{suffix.lower()}".rstrip(".")

records = []
for raw_entry in entries:
    raw_name, separator, raw_team = raw_entry.partition("|")
    if not separator:
        continue

    name = normalize_name(raw_name)
    team = raw_team.strip().title()
    handle = create_handle(name)
    records.append((name, team, handle))

# Sort by team and then by the display name.
records.sort(key=lambda entry: (entry[1], entry[0]))
print(f"{'Name':<20} {'Team':<12} Handle")
print("-" * 47)

for name, team, handle in records:
    print(f"{name:<20} {team:<12} @{handle}")`
  },
  {
    file: "build_schedule.py",
    chapter: 4,
    text: `# Organize a short workshop schedule using lists and tuples.
schedule = [
    (10, "Registration", 15),
    (30, "Design exercise", 35),
    (75, "Break", 10),
    (90, "Group review", 30),
]
extra_sessions = [(55, "Questions", 10), (65, "Demo", 10)]

# Work from a copy so the starting schedule stays available.
agenda = schedule.copy()
agenda.extend(extra_sessions)
agenda.sort()

room = "Studio B"
revised = []
for start, title, minutes in agenda:
    end = start + minutes
    revised.append((start, end, title))

# Build a list of any overlaps between neighboring sessions.
overlaps = []
for before, after in zip(revised, revised[1:]):
    if before[1] > after[0]:
        overlaps.append((before[2], after[2]))

print(f"Workshop schedule for {room}")
for start, end, title in revised:
    start_hour, start_minute = divmod(start, 60)
    end_hour, end_minute = divmod(end, 60)
    begins = f"{9 + start_hour}:{start_minute:02d}"
    finishes = f"{9 + end_hour}:{end_minute:02d}"
    print(f"{begins} to {finishes}  {title}")

if overlaps:
    print("Sessions that overlap:")
    for first, second in overlaps:
        print(f"  {first} overlaps with {second}")
else:
    print("There are no timing conflicts.")`
  },
  {
    file: "review_quiz_scores.py",
    chapter: 6,
    text: `# Assign feedback to scores from a weekly practice quiz.
scores = [
    ("Ana", 85),
    ("Ben", 58),
    ("Chris", 73),
    ("Dina", 102),
    ("Eli", None),
    ("Farah", 96),
    ("Gia", 45),
]

def assess(score):
    # Handle missing and out-of-range values first.
    if score is None:
        return "Missing", "Submit the quiz when ready."
    if not 0 <= score <= 100:
        return "Invalid", "Check the entered score."

    if score >= 90:
        return "Excellent", "Try the extension question."
    if score >= 70:
        return "Good", "Review the questions you missed."
    if score >= 50:
        return "Pass", "Revisit the worked examples."
    return "Retry", "Do the warm-up before your next try."

valid_scores = []
for name, score in scores:
    label, feedback = assess(score)
    print(f"{name:<7} {label:<10} {feedback}")
    if label not in {"Missing", "Invalid"}:
        valid_scores.append(score)

# Only report a mean when at least one score is valid.
if valid_scores:
    average = sum(valid_scores) / len(valid_scores)
    print(f"Class average: {average:.1f}%")
else:
    print("There are no valid scores to average.")`
  },
  {
    file: "temperature_summary.py",
    chapter: 8,
    text: `# Split a weather summary into small functions.
def to_fahrenheit(celsius):
    return celsius * 9 / 5 + 32

def mean(readings):
    if not readings:
        return None
    return sum(readings) / len(readings)

def present_range(label, readings):
    # Returning early keeps the formatting code simple.
    if not readings:
        return f"{label}: no measurements"

    low = min(readings)
    high = max(readings)
    center = mean(readings)
    return (
        f"{label}: {low:.1f} to {high:.1f} C, "
        f"mean {center:.1f} C "
        f"({to_fahrenheit(center):.1f} F)"
    )

morning = [13.6, 13.8, 14.4, 14.9]
afternoon = [20.1, 21.6, 21.9, 20.8]
evening = [15.3, 16.2, 17.0]

# Pass each group through the same formatting function.
groups = {
    "Morning": morning,
    "Afternoon": afternoon,
    "Evening": evening,
    "Overnight": [],
}

for label, readings in groups.items():
    print(present_range(label, readings))

assert to_fahrenheit(0) == 32
assert mean([10, 20, 30]) == 20`
  },
  {
    file: "read_expenses.py",
    chapter: 12,
    text: `# Parse a few expense entries without stopping at a bad row.
raw_rows = [
    "Bus fare, 40",
    "Lunch, 125.50",
    "Receipt total, unknown",
    "Notebook, 68",
    "Refund, -20",
    "No amount on this line",
]

def read_amount(row):
    name, separator, amount = row.rpartition(",")
    if not separator or not name.strip():
        raise ValueError("Expected a description and amount")

    value = float(amount.strip())
    return name.strip(), value

items = []
errors = []

for line, row in enumerate(raw_rows, start=1):
    try:
        name, amount = read_amount(row)
    except ValueError as error:
        errors.append((line, str(error)))
    else:
        items.append((name, amount))

print("Recorded expenses")
for name, amount in items:
    print(f"{name:<18} {amount:>7.2f}")

# Separate charges from refunds so the report is easy to check.
charges = []
refunds = []
for name, amount in items:
    if amount < 0:
        refunds.append((name, -amount))
    else:
        charges.append((name, amount))

charge_total = sum(amount for _, amount in charges)
refund_total = sum(amount for _, amount in refunds)
print(f"Charges: {charge_total:.2f}")
print(f"Refunds: {refund_total:.2f}")
print(f"Net amount: {charge_total - refund_total:.2f}")

if charges:
    largest = max(charges, key=lambda item: item[1])
    name, amount = largest
    print(f"Largest charge: {name} ({amount:.2f})")

# Keep the row number so each rejected entry can be checked.
if errors:
    print("Check these rows:")
    for line, error in errors:
        print(f"  Line {line}: {error}")`
  },
  {
    file: "keyboard_characters.py",
    chapter: 3,
    text: `# Verify the characters available in a US keyboard layout.
examples = [
    "the quick brown fox jumps over the lazy dog",
    "PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS",
]

digits = "0123456789"
number_symbols = "!@#$%^&*()"
other_symbols = r"""\`~_-+=[]{}|\\;:'",.<>/?"""
symbols = number_symbols + other_symbols

# Count distinct characters for each group.
groups = {
    "lowercase": examples[0].replace(" ", ""),
    "uppercase": examples[1].replace(" ", ""),
    "digits": digits,
    "symbols": symbols,
}

def ordered_unique(text):
    return "".join(sorted(set(text)))

for label, text in groups.items():
    unique = ordered_unique(text)
    print(f"{label:<10} {len(unique):>2}: {unique}")

# Check that the same letters appear in both example sentences.
lowercase = ordered_unique(groups["lowercase"])
uppercase = ordered_unique(groups["uppercase"]).lower()
assert lowercase == uppercase

# Count how often punctuation appears in a sample sentence.
sample = 'Wait... did Maya say "yes", or did she say "no"?'
for symbol in (".", ",", "?", '"'):
    count = sample.count(symbol)
    print(f"{symbol!r}: {count} occurrences")

all_symbols = set(symbols)
print(f"Distinct symbols: {len(all_symbols)}")`
  }
];
