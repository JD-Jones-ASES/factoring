# Nature's Quadratic Garden 🌿

An interactive web application for students to practice factoring quadratic expressions. With a nature-inspired design and engaging interface, students can build their factoring skills through unlimited practice problems with instant feedback.

## Features

### Core Functionality
- **Unlimited Practice Problems**: Generate endless quadratic expressions to factor
- **Two Difficulty Levels**:
  - **Easy Mode**: Quadratics with leading coefficient = 1 (format: x² + Bx + C)
  - **Hard Mode**: Quadratics with leading coefficient ≠ 1 (format: Ax² + Bx + C)
- **Common Factors Option**: Toggle to include problems with common factors that need to be factored out first
- **Intelligent Answer Checking**: Accepts multiple valid formats for factored expressions
- **Hint System**: Get helpful hints and see the correct answer when needed

### User Experience
- **Progress Tracking**: Monitor your performance with real-time statistics:
  - Number of correct answers
  - Total attempts
  - Accuracy percentage
  - Current streak
- **Theme Toggle**: Switch between dark mode (default) and light mode
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Nature-Themed Interface**: Calming green color palette with animated leaves

### Input Flexibility
The application accepts answers in various formats:
- `(x+2)(x-3)`
- `(2x+1)(x-5)`
- `3(x+1)(x-2)`
- `-(x+4)(x-1)`

## How It Works

### Problem Generation
The application generates quadratic expressions using the formula:

```
a(bx + c)(dx + e) = a·b·d·x² + a(b·e + c·d)x + a·c·e
```

Where:
- `a` = common factor (1-4, or always 1 if common factors disabled)
- `b`, `d` = coefficients for x terms in each factor
- `c`, `e` = constant terms in each factor

**Easy Mode**: Sets b = 1 and d = 1, resulting in quadratics with leading coefficient = 1

**Hard Mode**: Allows b and d to vary (1-4), creating quadratics with various leading coefficients

### Answer Verification
The system parses your input, expands it algebraically, and checks if it matches the original expression. This means any mathematically equivalent factorization is accepted!

## Getting Started

### Installation
1. Clone this repository:
```bash
git clone https://github.com/yourusername/natures-quadratic-garden.git
```

2. Open `index.html` in your web browser

That's it! No build process or dependencies required.

### Usage
1. Select your difficulty level (Easy or Hard)
2. Choose whether to include common factors
3. A quadratic expression will appear
4. Enter your factored form in the input box
5. Click "Check Answer" or press Enter
6. Get instant feedback and track your progress!

## File Structure

```
natures-quadratic-garden/
│
├── index.html          # Main HTML structure and embedded JavaScript
├── script.js           # Standalone JavaScript file (alternative)
├── README.md           # This file
└── LICENSE             # MIT License
```

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Educational Value

This tool helps students:
- Practice factoring quadratics with immediate feedback
- Understand the relationship between factored and expanded forms
- Build confidence through gamified progress tracking
- Learn to recognize patterns in quadratic factoring
- Prepare for algebra tests and standardized exams

## Technical Details

- **Pure Vanilla JavaScript**: No frameworks or libraries required
- **Client-Side Only**: All computation happens in the browser
- **In-Memory Storage**: Stats and theme preference stored during session
- **Responsive CSS**: Mobile-first design with CSS Grid and Flexbox

## Contributing

Contributions are welcome! Here are some ways you can help:
- Report bugs or suggest features via GitHub Issues
- Submit pull requests for enhancements
- Improve documentation
- Share with students and educators

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for engaging, accessible math practice tools
- Nature theme designed to create a calming learning environment

## Contact

Questions, suggestions, or feedback? Feel free to open an issue on GitHub!

---