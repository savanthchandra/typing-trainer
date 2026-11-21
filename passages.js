"use strict";

const englishPassages = [
  {
    title: "Morning at the market",
    text: 'Maya took the long way to the market, past the blue bakery and the quiet square. "Have you tried the ginger jam?" asked the vendor. She bought two jars, tucked them into her bag, and caught the next bus home.'
  },
  {
    title: "The print shop",
    text: 'June found an old typewriter in the back of the print shop. Its owner said, "Try this: the quick brown fox jumps over the lazy dog." On the wall, a poster read, "PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS!" Every key on the old machine still worked.'
  },
  {
    title: "Up the hill",
    text: "At 6:45, we reached the fork in the trail. The sign read, 'Lookout (1 km); lake (2 km).' I checked our map: had we missed the bridge? No, it was just beyond the bend. We crossed it, unwrapped our sandwiches, and watched the clouds drift over the valley."
  },
  {
    title: "A note from the library",
    text: 'The library sent a reminder: "Your book is due Friday, April 17." Leo looked under his desk, behind the sofa, and inside his backpack. Where had he left it? His sister laughed. "You finished it at breakfast!" Sure enough, it was still on the kitchen table.'
  }
].map(passage => ({ ...passage, kind: "english" }));

const pythonPassages = [
  {
    title: "Measure a garden path",
    chapter: 1,
    text: `# Import the math module so we can use its square root function.
import math

# Measure the two sides of the garden in meters.
width = 3
length = 4

# Square both sides and add the results.
squared_distance = width ** 2 + length ** 2

# The square root gives the distance from corner to corner.
distance = math.sqrt(squared_distance)

# Show the measurements and the length of the path.
print("Garden:", width, "by", length, "meters")
print("Path length:", distance, "meters")`
  },
  {
    title: "Split the cafe bill",
    chapter: 2,
    text: `# Add the price of each drink and snack.
coffee = 80
tea = 45
sandwich = 120
subtotal = coffee + tea + sandwich

# Calculate a 10% tip, then add it to the bill.
tip_rate = 0.10
tip = subtotal * tip_rate
total = subtotal + tip

# Divide the final bill between two people.
people = 2
per_person = total / people

# Display the total and each person's share.
print("Subtotal:", subtotal)
print("Tip:", tip)
print("Each person pays:", per_person)`
  },
  {
    title: "Clean a name tag",
    chapter: 3,
    text: `# A visitor wrote their name with extra spaces.
raw_name = "  maya joseph  "

# Remove the extra spaces and capitalize the words.
name = raw_name.strip().title()

# Find the first space to separate the two names.
space_position = name.find(" ")
first_name = name[:space_position]
last_name = name[space_position + 1:]

# Build a short label from the first name and last initial.
initial = last_name[0]
label = f"{first_name} {initial}."

# Print the label so it can go on a name tag.
print(f"Name tag: [{label}]")`
  },
  {
    title: "Track visits to the book club",
    chapter: 5,
    text: `# Keep a list of the names signed in this month.
visits = ["Maya", "Leo", "Maya", "Zoey", "Leo", "Maya"]

# Use a set to find how many different people attended.
members = set(visits)
print(f"Unique visitors: {len(members)}")

# Build a dictionary that tracks the number of visits per person.
counts = {}
for name in visits:
    counts[name] = counts.get(name, 0) + 1

# Print each person's name and total in alphabetical order.
for name, count in sorted(counts.items()):
    print(f"{name}: {count} visits")`
  },
  {
    title: "Check the quiz results",
    chapter: 6,
    text: `# Read a score out of 100 and choose a message for it.
score = 76

# Check that the score is within the allowed range.
if score < 0 or score > 100:
    message = "Enter a score from 0 to 100."
elif score >= 85:
    message = "Excellent work!"
elif score >= 60:
    message = "You passed."
else:
    message = "Try again after more practice."

# Show the score and the message together.
print(f"Quiz score: {score}%")
print(message)`
  },
  {
    title: "Sum the even numbers",
    chapter: 7,
    text: `# Choose the last number to check.
limit = 12
total = 0
count = 0

# Check every number from 1 through the limit.
for number in range(1, limit + 1):
    # Skip odd numbers, which leave a remainder of 1.
    if number % 2 != 0:
        continue

    # Add the even number and count it.
    total += number
    count += 1

# Print how many even numbers we found and their sum.
print(f"Even numbers found: {count}")
print(f"Sum: {total}")`
  },
  {
    title: "Convert a set of temperatures",
    chapter: 8,
    text: `# Define a function that converts Celsius to Fahrenheit.
def to_fahrenheit(celsius):
    return celsius * 9 / 5 + 32

# Define another function to format the result.
def format_temperature(celsius):
    fahrenheit = to_fahrenheit(celsius)
    return f"{celsius} C = {fahrenheit:.1f} F"

# Convert each reading and show it on a separate line.
readings = [-5, 0, 18, 24, 37]
for reading in readings:
    print(format_temperature(reading))

# Check two familiar reference points.
assert to_fahrenheit(0) == 32
assert to_fahrenheit(100) == 212`
  },
  {
    title: "Check the symbols on a keyboard",
    chapter: 3,
    text: `# A US QWERTY keyboard has symbols above the number keys.
number_symbols = "!@#$%^&*()"

# A raw string lets us store a backslash as a literal character.
other_symbols = r"""\`~_-+=[]{}|\\;:'",.<>/?"""

# Join the two strings and count the available symbols.
symbols = number_symbols + other_symbols
print(f"Symbols found: {len(symbols)}")

# Print the first five and the final five symbols.
print("First five:", symbols[:5])
print("Last five:", symbols[-5:])

# Check if selected characters are in the string.
for symbol in ("@", "|", "?"):
    print(f"{symbol}: {symbol in symbols}")`
  },
  {
    title: "Handle an invalid number",
    chapter: 12,
    text: `# These values were copied from a handwritten list.
entries = ["18", "24", "?", "12"]
valid_numbers = []

# Convert each entry to an integer when possible.
for entry in entries:
    try:
        number = int(entry)
    except ValueError:
        # A question mark cannot be converted to an integer.
        print(f"Skipped invalid entry: {entry!r}")
    else:
        valid_numbers.append(number)

# Calculate the average only if a valid number was found.
if valid_numbers:
    average = sum(valid_numbers) / len(valid_numbers)
    print(f"Average: {average:.2f}")`
  }
].map(passage => ({ ...passage, kind: "python" }));

const mixedPassages = pythonPassages.flatMap((passage, index) => (
  index < englishPassages.length ? [englishPassages[index], passage] : [passage]
));

const passageGroups = { mixed: mixedPassages, english: englishPassages, python: pythonPassages };
const lessonBaseUrl = "https://savanthchandra.github.io/python-daily/#concepts/ch";
