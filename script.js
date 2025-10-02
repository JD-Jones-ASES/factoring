// State management
let currentProblem = null;
let stats = {
    correct: 0,
    attempted: 0,
    streak: 0
};

// Theme management (using memory instead of localStorage)
let currentTheme = 'dark';

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Problem generation
function generateProblem() {
    const difficulty = document.getElementById('difficulty').value;
    const includeCommon = document.getElementById('common-factors').checked;
    
    let a, b, c, d, e;
    
    // Generate base values
    if (difficulty === 'easy') {
        // Leading coefficient = 1 (b*d = 1)
        b = 1;
        d = 1;
        c = Math.floor(Math.random() * 13) - 6; // -6 to 6
        e = Math.floor(Math.random() * 13) - 6; // -6 to 6
    } else {
        // Leading coefficient != 1
        b = Math.floor(Math.random() * 4) + 1; // 1 to 4
        d = Math.floor(Math.random() * 4) + 1; // 1 to 4
        c = Math.floor(Math.random() * 11) - 5; // -5 to 5
        e = Math.floor(Math.random() * 11) - 5; // -5 to 5
    }
    
    // Common factor
    a = includeCommon ? (Math.floor(Math.random() * 4) + 1) : 1; // 1 to 4 or just 1
    
    // Calculate coefficients: a*(b*x+c)(d*x+e) = a*b*d*x^2 + a*(b*e+c*d)*x + a*c*e
    const A = a * b * d;
    const B = a * (b * e + c * d);
    const C = a * c * e;
    
    currentProblem = {
        a: a,
        b: b,
        c: c,
        d: d,
        e: e,
        A: A,
        B: B,
        C: C
    };
    
    displayProblem();
    clearFeedback();
}

function displayProblem() {
    const expression = document.getElementById('expression');
    const { A, B, C } = currentProblem;
    
    let expr = '';
    
    // Leading term
    if (A === 1) {
        expr += 'x²';
    } else if (A === -1) {
        expr += '-x²';
    } else {
        expr += A + 'x²';
    }
    
    // Middle term
    if (B !== 0) {
        if (B === 1) {
            expr += ' + x';
        } else if (B === -1) {
            expr += ' - x';
        } else if (B > 0) {
            expr += ' + ' + B + 'x';
        } else {
            expr += ' - ' + Math.abs(B) + 'x';
        }
    }
    
    // Constant term
    if (C !== 0) {
        if (C > 0) {
            expr += ' + ' + C;
        } else {
            expr += ' - ' + Math.abs(C);
        }
    }
    
    expression.textContent = expr;
}

// Helper function to expand a factored form to verify the answer
function expandFactoredForm(a, factors) {
    // factors is an array of {coeff, constant} objects
    // We expand a * (f1.coeff*x + f1.constant) * (f2.coeff*x + f2.constant)
    if (factors.length !== 2) return null;
    
    const f1 = factors[0];
    const f2 = factors[1];
    
    // (b*x + c) * (d*x + e) = bd*x^2 + (be + cd)*x + ce
    const A = a * f1.coeff * f2.coeff;
    const B = a * (f1.coeff * f2.constant + f1.constant * f2.coeff);
    const C = a * f1.constant * f2.constant;
    
    return { A, B, C };
}

// Answer checking
function checkAnswer() {
    const input = document.getElementById('answer-input').value.trim();
    if (!input) {
        showFeedback('Please enter an answer', 'error');
        return;
    }
    
    stats.attempted++;
    
    if (isCorrectAnswer(input)) {
        stats.correct++;
        stats.streak++;
        showFeedback(`Correct! 🌱 Great job! Streak: ${stats.streak}`, 'success');
        setTimeout(generateProblem, 2000);
    } else {
        stats.streak = 0;
        showFeedback('Not quite right. Try again or click "Show Hint" for help.', 'error');
    }
    
    updateStatsDisplay();
}

function isCorrectAnswer(input) {
    const parsed = parseFactoredForm(input);
    if (!parsed) return false;
    
    // Expand the parsed form and check if it matches the original problem
    const expanded = expandFactoredForm(parsed.leadingCoeff, parsed.factors);
    if (!expanded) return false;
    
    // Check if the expanded form matches the original problem
    return (
        expanded.A === currentProblem.A &&
        expanded.B === currentProblem.B &&
        expanded.C === currentProblem.C
    );
}

function parseFactoredForm(input) {
    // Remove all spaces and convert to lowercase for easier parsing
    input = input.replace(/\s/g, '').toLowerCase();
    
    // Extract all coefficients and factors from the input
    let leadingCoeff = 1;
    const factors = [];
    
    // First, extract any leading coefficient before parentheses or x
    const leadingMatch = input.match(/^(-?\d+)(?=\(|x)/);
    if (leadingMatch) {
        leadingCoeff = parseInt(leadingMatch[1]);
        input = input.substring(leadingMatch[0].length);
    }
    
    // Now we need to find all factors and any additional coefficients
    // Pattern 1: Parenthesized factors like (3x+1) or (x-2) or just (x)
    const parenPattern = /\(([+-]?\d*)x([+-]\d+)?\)/g;
    let match;
    const usedIndices = new Set();
    
    while ((match = parenPattern.exec(input)) !== null) {
        let coeff = match[1];
        if (coeff === '' || coeff === '+') {
            coeff = 1;
        } else if (coeff === '-') {
            coeff = -1;
        } else {
            coeff = parseInt(coeff);
        }
        
        // match[2] might be undefined for bare (x)
        const constant = match[2] ? parseInt(match[2]) : 0;
        
        factors.push({ coeff, constant });
        
        // Mark the indices as used
        for (let i = match.index; i < match.index + match[0].length; i++) {
            usedIndices.add(i);
        }
    }
    
    // Pattern 2: Bare 'x' not in parentheses (represents x+0 or 1x+0)
    for (let i = 0; i < input.length; i++) {
        if (input[i] === 'x' && !usedIndices.has(i)) {
            // Check if there's a coefficient before this x
            let coeff = 1;
            let j = i - 1;
            let numStr = '';
            
            // Go backwards to collect digits
            while (j >= 0 && (input[j].match(/\d/) || (numStr === '' && input[j] === '-'))) {
                numStr = input[j] + numStr;
                if (usedIndices.has(j)) break;
                j--;
            }
            
            if (numStr && !usedIndices.has(i - numStr.length)) {
                coeff = parseInt(numStr) || 1;
                // Mark these indices as used
                for (let k = i - numStr.length; k < i; k++) {
                    usedIndices.add(k);
                }
            }
            
            factors.push({ coeff: coeff, constant: 0 });
            usedIndices.add(i);
        }
    }
    
    // Pattern 3: Any remaining numbers that weren't captured are additional coefficients
    for (let i = 0; i < input.length; i++) {
        if (!usedIndices.has(i) && input[i].match(/\d/)) {
            let numStr = '';
            let j = i;
            while (j < input.length && input[j].match(/\d/)) {
                if (!usedIndices.has(j)) {
                    numStr += input[j];
                }
                j++;
            }
            if (numStr) {
                leadingCoeff *= parseInt(numStr);
                for (let k = i; k < i + numStr.length; k++) {
                    usedIndices.add(k);
                }
            }
        }
    }
    
    // Handle negative sign at the start
    if (input.startsWith('-') && leadingCoeff > 0) {
        leadingCoeff = -leadingCoeff;
    }
    
    if (factors.length !== 2) return null;
    
    return {
        leadingCoeff,
        factors
    };
}

// Hint generation
function showHint() {
    const { a, b, c, d, e, A, B, C } = currentProblem;
    const hint = document.getElementById('hint');
    
    let hintText = '💡 Hint: ';
    
    if (a > 1) {
        hintText += `First, factor out the common factor ${a}. `;
    }
    
    const factoredA = A / a;
    const factoredB = B / a;
    const factoredC = C / a;
    
    if (factoredA === 1) {
        hintText += `Look for two numbers that multiply to ${factoredC} and add to ${factoredB}.`;
    } else {
        hintText += `After factoring out any common factors, you need to find factors of ${factoredA * factoredC} that add up to ${factoredB}.`;
    }
    
    // Add the actual answer
    const factor1 = b === 1 ? `(x${c >= 0 ? '+' : ''}${c})` : `(${b}x${c >= 0 ? '+' : ''}${c})`;
    const factor2 = d === 1 ? `(x${e >= 0 ? '+' : ''}${e})` : `(${d}x${e >= 0 ? '+' : ''}${e})`;
    const fullAnswer = a === 1 ? `${factor1}${factor2}` : `${a}${factor1}${factor2}`;
    
    hintText += ` The answer is: ${fullAnswer}`;
    
    hint.textContent = hintText;
    hint.classList.add('show');
}

// UI helpers
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback show ${type}`;
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    const hint = document.getElementById('hint');
    const input = document.getElementById('answer-input');
    
    feedback.className = 'feedback';
    hint.className = 'hint';
    input.value = '';
}

function updateStatsDisplay() {
    document.getElementById('correct-count').textContent = stats.correct;
    document.getElementById('attempt-count').textContent = stats.attempted;
    document.getElementById('streak').textContent = stats.streak;
    
    const accuracy = stats.attempted > 0 
        ? Math.round((stats.correct / stats.attempted) * 100) 
        : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

function resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        stats = { correct: 0, attempted: 0, streak: 0 };
        updateStatsDisplay();
        showFeedback('Statistics reset!', 'success');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    initTheme();
    generateProblem();
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Problem generation
    document.getElementById('new-problem').addEventListener('click', generateProblem);
    
    // Answer checking
    document.getElementById('check-answer').addEventListener('click', checkAnswer);
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    // Hint
    document.getElementById('show-hint').addEventListener('click', showHint);
    
    // Stats reset
    document.getElementById('reset-stats').addEventListener('click', resetStats);
    
    // Settings change
    document.getElementById('difficulty').addEventListener('change', generateProblem);
    document.getElementById('common-factors').addEventListener('change', generateProblem);
});