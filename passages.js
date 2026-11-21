"use strict";

const lessonBaseUrl = "https://savanthchandra.github.io/python-daily/#concepts/ch";

const pythonPassages = [
  {
    file: "inventory_report.py",
    level: "medium",
    chapter: 5,
    text: `# Build an inventory report from a list of stock movements.
# This program combines deliveries and sales, then warns us
# when an item has fewer than five units left.
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
    level: "medium",
    chapter: 7,
    text: `# Report lap times for a runner, with splits every three laps.
# The input is a list of times in seconds. The program shows
# elapsed time after each lap and identifies the fastest lap.
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

# Recover the first and last lap numbers for each saved split.
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
    level: "medium",
    chapter: 1,
    text: `# Use standard library modules to summarize a walking route.
# Each stop has coordinates. The program calculates distances,
# estimates walking time, and suggests where to stop for water.
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
    level: "hard",
    chapter: 3,
    text: `# Turn unevenly spaced contact entries into display labels.
# The program takes a name and team from each entry, cleans them,
# and makes a short handle for a sorted contact list.
entries = [
    "  maya  johnson | EVENTS ",
    "Leo Ng | tech",
    "zoey   carter | OPERATIONS",
    "  KAI DESAI | design ",
    "Sam   Flores | TECH  ",
]

# Normalize the words before generating handles.
def normalize_name(raw_name):
    # split without an argument also handles repeated spaces.
    words = raw_name.split()
    return " ".join(word.capitalize() for word in words)

def create_handle(name):
    first, *rest = name.split()
    # Take up to three characters from the final name.
    suffix = rest[-1][:3] if rest else ""
    return f"{first.lower()}.{suffix.lower()}".rstrip(".")

# Clean each entry and skip rows without the separator.
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
    level: "medium",
    chapter: 4,
    text: `# Organize a short workshop schedule using lists and tuples.
# Each session has a start time and duration. The program sorts
# the sessions, displays their times, and flags any overlaps.
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

# Add the finish time to each session so it can be compared.
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
    level: "medium",
    chapter: 6,
    text: `# Assign feedback to scores from a weekly practice quiz.
# This program gives each student a message based on their score
# and calculates an average using only valid scores.
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

# Display feedback and keep only scores that can be averaged.
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
    level: "medium",
    chapter: 8,
    text: `# Split a weather summary into small functions.
# This program groups readings by time of day and reports the
# temperature range and average for each group.
def to_fahrenheit(celsius):
    return celsius * 9 / 5 + 32

# Return None for an empty group to avoid dividing by zero.
def mean(readings):
    if not readings:
        return None
    return sum(readings) / len(readings)

# Format a nonempty group and include the average in Fahrenheit.
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
    level: "hard",
    chapter: 12,
    text: `# Parse a few expense entries without stopping at a bad row.
# The program reports valid charges and refunds, then tells us
# which rows need fixing.
raw_rows = [
    "Bus fare, 40",
    "Lunch, 125.50",
    "Receipt total, unknown",
    "Notebook, 68",
    "Refund, -20",
    "No amount on this line",
]

# Use the final comma so a description can also contain commas.
def read_amount(row):
    name, separator, amount = row.rpartition(",")
    if not separator or not name.strip():
        raise ValueError("Expected a description and amount")

    value = float(amount.strip())
    return name.strip(), value

# Try each row independently so one bad amount does not stop us.
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
    level: "medium",
    chapter: 3,
    text: `# Verify the characters available in a US keyboard layout.
# This program counts the letters and symbols in groups and
# checks that both practice sentences cover the alphabet.
examples = [
    "the quick brown fox jumps over the lazy dog",
    "PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS",
]

# Combine the symbols from the number and punctuation keys.
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

pythonPassages.unshift(
  {
    file: "trip_budget.py",
    level: "easy",
    chapter: 2,
    text: `# Check whether a day trip fits within a simple budget.
# This program adds travel, food, and ticket costs, then compares
# the total with the amount the group can spend.

# Start with the number of travelers and their shared budget.
travelers = 4
budget = 3200

# These three costs apply to each traveler.
bus_fare = 180
lunch = 240
entry_ticket = 110

# Add those costs together before scaling up to the whole group.
cost_per_person = bus_fare + lunch + entry_ticket
group_cost = cost_per_person * travelers

# Subtract the planned cost to find the money left over.
money_left = budget - group_cost

print("Day trip budget")
print("Travelers:", travelers)
print("Cost per person:", cost_per_person)
print("Cost for the group:", group_cost)

# A negative balance means the plan costs more than the budget.
if money_left >= 0:
    print("The trip fits the budget.")
    print("Money left:", money_left)
else:
    # Flip the sign so the shortfall is easy to read.
    shortfall = -money_left
    print("The group needs more money.")
    print("Shortfall:", shortfall)

# Check the effect of setting aside a small emergency amount.
reserve = 500
after_reserve = money_left - reserve

if after_reserve >= 0:
    print("Money left after reserve:", after_reserve)
else:
    print("There is not enough for the full reserve.")`
  },
  {
    file: "packing_checklist.py",
    level: "easy",
    chapter: 4,
    text: `# Track the items to pack for a weekend away.
# This program keeps a list of items already packed and a list
# of items still needed. At the end it prints a short checklist.

needed = ["shirt", "toothbrush", "charger", "notebook"]
packed = ["shirt", "charger"]
missing = []

# Read the required items one at a time and record any gaps.
for item in needed:
    if item not in packed:
        missing.append(item)

# Print everything that still needs to go into the bag.
print("Packing checklist")
for item in missing:
    print("Still needed:", item)

# Assume the missing items have just been added to the bag.
packed.extend(missing)
packed.sort()

# Print the final list in alphabetical order.
print("Final bag:")
for item in packed:
    print("-", item)

# Compare the final number with the number of items required.
packed_count = len(packed)
needed_count = len(needed)
print("Packed:", packed_count)

if packed_count == needed_count:
    print("All required items are in the bag.")
else:
    print("The bag still needs another check.")`
  },
  {
    file: "daily_temperatures.py",
    level: "easy",
    chapter: 7,
    text: `# Find warm and cool readings from one day.
# This program loops through a list of temperatures, records
# how often they pass a threshold, and calculates the average.

# These readings were recorded every few hours.
readings = [19, 22, 25, 27, 26, 23, 21]
threshold = 24
total = 0
warm_count = 0

# Add each reading to the running total.
for temperature in readings:
    total += temperature

    # Treat a reading at or above the threshold as warm.
    if temperature >= threshold:
        warm_count += 1
        print("Warm reading:", temperature)
    else:
        print("Cool reading:", temperature)

# Divide by the number of readings to calculate the mean.
sample_count = len(readings)
average = total / sample_count
cool_count = sample_count - warm_count

print("Daily report")
print("Warm readings:", warm_count)
print("Cool readings:", cool_count)
print("Average temperature:", round(average, 1))

# Show the coldest and warmest moments of the day.
print("Lowest temperature:", min(readings))
print("Highest temperature:", max(readings))`
  }
);

pythonPassages.push({
  file: "club_attendance.py",
  level: "hard",
  chapter: 5,
  text: `# Build an attendance report from raw club sign-ins.
# This program groups visits by session, ignores duplicate
# sign-ins, and ranks members by their attendance across sessions.

records = [
    ("Tuesday", "Maya"),
    ("Tuesday", "Leo"),
    ("Tuesday", "Maya"),
    ("Thursday", "Zoey"),
    ("Thursday", "Leo"),
    ("Thursday", "Maya"),
    ("Saturday", "Leo"),
    ("Saturday", "Ana"),
]

def group_sessions(sign_ins):
    # Each session has a set, so adding a name twice is harmless.
    sessions = {}
    for day, name in sign_ins:
        sessions.setdefault(day, set()).add(name)
    return sessions

def count_visits(sessions):
    # Invert the data so each member has a set of days attended.
    member_days = {}
    for day, attendees in sessions.items():
        for name in attendees:
            member_days.setdefault(name, set()).add(day)
    return member_days

def rank_members(member_days):
    # Sort by descending visit count and break ties by name.
    rows = [(name, len(days)) for name, days in member_days.items()]
    return sorted(rows, key=lambda row: (-row[1], row[0]))

sessions = group_sessions(records)
member_days = count_visits(sessions)
leaders = rank_members(member_days)

print("Attendance by day")
for day, attendees in sessions.items():
    joined_names = ", ".join(sorted(attendees))
    print(f"{day:<10} {len(attendees):>2}  {joined_names}")

# Find people who attended every session using set intersection.
all_sessions = list(sessions.values())
regulars = set.intersection(*all_sessions) if all_sessions else set()
print("Every session:", ", ".join(sorted(regulars)) or "None")

print("Members ranked by visits")
for rank, (name, visits) in enumerate(leaders, start=1):
    days = ", ".join(sorted(member_days[name]))
    print(f"{rank}. {name:<8} {visits} visits ({days})")

# A duplicate should never add a second visit on the same day.
assert len(member_days["Maya"]) == 2
assert "Leo" in regulars`
});

const englishPassages = [
  {
    file: "Morning at the market",
    text: `Maya took the long way to the market, past the blue bakery and the quiet square. The town was still waking up, but the market had been busy for an hour. A vendor carefully stacked apples in wooden crates, and someone at the next stall was trying to keep a sheet of paper from blowing into the road. Maya had brought an empty bag and a short list.

She usually bought the same things, so a small jar of ginger jam caught her attention. "Would you like to try it?" asked the vendor. He handed her a clean spoon and waited while she tasted it. The jam was warm and sharp, with just enough sweetness. Maya bought two jars, one for herself and one for her neighbor, who always left extra lemons by her door.

At the flower stall, she recognized a woman from the morning bus. They had seen each other nearly every weekday for a year and had never spoken. Today they talked about the rain, then about where they used to live. The woman had moved across town in spring and still took the longer bus because she liked watching the river on the way to work.

By the time Maya reached the bread stall, the sun had come over the roofs. She bought a loaf, checked off the last item, and found a seat near the fountain. She could have gone straight home, but the next bus was twenty minutes away. She tore off a piece of bread and stayed where she was, listening to the market fill up around her.`
  },
  {
    file: "A walk after the rain",
    text: `The rain stopped just before noon, leaving a thin line of water along the edge of every pavement. Leo put on his old shoes and went outside. He had planned to finish a book that morning, but after three chapters he knew he was reading the same paragraph without taking much in. A walk through the park seemed like a better use of the next hour.

At the gate he found a map he had never noticed. The wide path went straight to the lake. A thinner line turned past the playing fields, crossed a bridge, and ended near a stone wall. He took the smaller path because he wanted to find out what was on the other side. His shoes sank a little on the soft ground, and a blackbird waited on a branch until he had passed.

The bridge was barely wide enough for two people. An older man was leaning over the rail, watching the water move around a fallen branch. "It looks different after a storm," he said. Leo stopped beside him, and for a while they watched a leaf turn slowly in an eddy. Then the leaf broke free and floated beneath the bridge.

Beyond the wall there was a field with a single bench. Leo had walked past that part of the park for years without finding the path to it. He sat down and called his sister, who had lived nearby before she moved. She remembered the bench, and she told him to look for a date carved into its back. He found it near the left corner, half covered by a patch of moss.`
  },
  {
    file: "An evening workshop",
    text: `For the first ten minutes of the workshop, nothing seemed to fit. Zoey held one piece of wood against another and could not line up the corners. The instructor stopped beside her table and asked which side she was using as a guide. Zoey pointed to the short edge. "Try the longer one," he said, sliding the board around. The corners met as soon as she did.

She was building a small shelf for books and a few plants. At home, she had usually tried to get a job done quickly before putting the tools away. Here, an extra minute of measuring was part of the work. She marked two points with a pencil, checked them twice, and made the holes before turning the next piece over.

Across the room, two people were working on a bench. They took turns holding the ends while one of them tightened a screw. Nobody finished at the same time, and nobody seemed bothered by that. Every so often, someone asked for a second pair of hands. The instructor moved from table to table, offering a question or showing how a tool felt when it was held correctly.

The shelf was almost level when Zoey stood it up. One foot was a little high, and she spent several minutes sanding it down. When it stopped rocking, she set her water bottle on the top just to see that it would stay there. On the bus home, she held the shelf on her lap, already thinking about which corner of her room had the best light for a plant.`
  },
  {
    file: "The local library",
    text: `The library opened at nine, and Sam arrived before the door was unlocked. He had a book to return and a list of things to look up. His grandmother had talked about a shop on the corner of Green Street, and he wanted to see whether an old photograph showed it. She remembered the window and the green sign, but she could not remember the name.

The librarian pointed him toward a small cabinet near the stairs. Inside were paper folders sorted by street. Some pictures had notes on the back with dates and names. Others only showed a row of people or the side of a bus. Sam started with the oldest folder and moved forward a few years at a time.

Near the bottom of a folder marked 1974, he found a picture of workers repairing the road. Most of the frame showed a truck and a pile of stones. At the far right, just behind one of the workers, there was a narrow shopfront. The sign had been cut off in the picture, but the edge of the window looked like the one his grandmother had described.

He took a closer look with a magnifying glass and saw the first four letters of the name. The librarian found a street directory from the same year, and together they traced the names on the page until one matched. Sam wrote it down and made a copy of the photograph. Later, when he showed it to his grandmother, she remembered going there on Saturday mornings to buy paper bags of peppermints.`
  }
].map(exercise => ({ ...exercise, kind: "english" }));

const codingPassages = pythonPassages.map(exercise => ({ ...exercise, kind: "python" }));
