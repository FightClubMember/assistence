// Question Bank for Study Duel (Layer D)
// Scaled to SSC CGL Tier 1/2, UPSC CSE, and CDS benchmarks.

export const QUESTION_BANK = {
  quant: [
    {
      question: "If a traveler walks at 15 km/h instead of 10 km/h, they would have walked 20 km more. What is the actual distance traveled at 10 km/h?",
      options: ["30 km", "40 km", "50 km", "60 km"],
      correctIndex: 1, // 40 km
      explanation: "Let the actual time taken be T hours.\nDistance 1 = 10 * T, Distance 2 = 15 * T.\nAccording to query: 15T - 10T = 20 km => 5T = 20 => T = 4 hours.\nActual distance = 10 * 4 = 40 km."
    },
    {
      question: "Solve the algebraic expression: If x + 1/x = 5, what is the value of x² + 1/x²?",
      options: ["27", "25", "23", "21"],
      correctIndex: 2, // 23
      explanation: "Squaring both sides of x + 1/x = 5:\n(x + 1/x)² = 5²\nx² + 2(x)(1/x) + 1/x² = 25\nx² + 2 + 1/x² = 25 => x² + 1/x² = 23."
    },
    {
      question: "A merchant marks his goods 20% above the cost price and then allows a discount of 10%. What is his net gain percentage?",
      options: ["8%", "10%", "12%", "15%"],
      correctIndex: 0, // 8%
      explanation: "Let Cost Price (CP) = 100.\nMarked Price (MP) = 120.\nDiscount = 10% of 120 = 12.\nSelling Price (SP) = 120 - 12 = 108.\nNet Gain = SP - CP = 108 - 100 = 8%."
    },
    {
      question: "Find the value of: sin²(30°) + cos²(60°) + tan²(45°).",
      options: ["1.25", "1.5", "1.75", "2.0"],
      correctIndex: 1, // 1.5
      explanation: "sin(30°) = 0.5 => sin²(30°) = 0.25\ncos(60°) = 0.5 => cos²(60°) = 0.25\ntan(45°) = 1.0 => tan²(45°) = 1.0\nSum = 0.25 + 0.25 + 1.0 = 1.5."
    },
    {
      question: "A sum of money doubles itself in 6 years at simple interest. In how many years will it become 4 times of itself?",
      options: ["12 years", "15 years", "18 years", "24 years"],
      correctIndex: 2, // 18 years
      explanation: "For simple interest, doubling means gaining interest equal to the principal (P) in 6 years.\nTo become 4 times, the total interest needed is 3P.\nTime required = 6 years * 3 = 18 years."
    }
  ],
  gs: [
    {
      question: "Under the Indian Constitution, who among the following is considered the 'Guardian of the Constitution'?",
      options: ["The President of India", "The Prime Minister of India", "The Parliament", "The Supreme Court of India"],
      correctIndex: 3, // Supreme Court
      explanation: "The Supreme Court of India is the ultimate interpreter and Guardian of the Constitution of India, with power of judicial review (Laxmikanth Polity Core alignment)."
    },
    {
      question: "Which of the following thermal winds blows from the Sahara Desert across the Mediterranean Sea to Southern Europe?",
      options: ["Sirocco", "Mistral", "Chinook", "Harmattan"],
      correctIndex: 0, // Sirocco
      explanation: "Sirocco is a Mediterranean wind that comes from the Sahara and reaches hurricane speeds in North Africa and Southern Europe, carrying red dust particles."
    },
    {
      question: "Arrange the following historical events in ascending chronological order:\n1. Non-Cooperation Movement\n2. Champaran Satyagraha\n3. Civil Disobedience Movement\n4. Quit India Movement",
      options: ["2 -> 1 -> 3 -> 4", "1 -> 2 -> 3 -> 4", "2 -> 3 -> 1 -> 4", "2 -> 1 -> 4 -> 3"],
      correctIndex: 0, // Champaran(1917) -> NCM(1920) -> CDM(1930) -> QIM(1942)
      explanation: "Champaran Satyagraha occurred in 1917.\nNon-Cooperation Movement launched in 1920.\nCivil Disobedience Movement launched in 1930.\nQuit India Movement launched in 1942.\nCorrect order: 2 -> 1 -> 3 -> 4."
    },
    {
      question: "Which of the following macroeconomic indicators measures the general rate of inflation based on a basket of wholesale goods?",
      options: ["Consumer Price Index (CPI)", "Wholesale Price Index (WPI)", "GDP Deflator", "Index of Industrial Production (IIP)"],
      correctIndex: 1, // WPI
      explanation: "WPI measures the change in the price of goods in the wholesale market, published by the Office of Economic Adviser, Ministry of Commerce and Industry."
    },
    {
      question: "In physics, what is the work done by a centripetal force acting on an object moving in a perfect circular orbit?",
      options: ["Zero", "Maximum", "Infinite", "Negative"],
      correctIndex: 0, // Zero
      explanation: "Work = Force * Displacement * cos(θ). In a circular orbit, the centripetal force is always perpendicular to the direction of motion (θ = 90°). Since cos(90°) = 0, the work done is zero."
    }
  ],
  lang: [
    {
      question: "Identify the word with the CORRECT English spelling configuration:",
      options: ["Maintenance", "Maintainance", "Maintenence", "Maintenanse"],
      correctIndex: 0, // Maintenance
      explanation: "Spelled 'maintenance'. Derived from 'maintain', but the middle spelling shifts from 'tain' to 'te' before the suffix 'nance'."
    },
    {
      question: "Spot the grammatical error: 'Neither of the five candidates is suitable for the corporate governance post.'",
      options: ["'Neither of'", "'candidates'", "'is suitable'", "No error in sentence"],
      correctIndex: 0, // 'Neither of' should be 'None of'
      explanation: "'Neither' is used when choosing between exactly two options. For five candidates, the correct pronoun is 'None'."
    },
    {
      question: "Select the sentence with the correct placement of the Hindi word 'आशीर्वाद' (Blessing):",
      options: [
        "हमें बड़ों का आशिर्वाद लेना चाहिए।",
        "हमें बड़ों का आशीर्वाद लेना चाहिए।",
        "हमें बड़ों का कवयत्री आशीर्वाद लेना चाहिए।",
        "हमें बड़ों का उज्वल आशिर्वाद लेना चाहिए।"
      ],
      correctIndex: 1, // आशीर्वाद is correct
      explanation: "'आशीर्वाद' is the correct spelling. The 'रेफ' (र्) sound is placed on the letter 'वा' (शीर्वाद) because it is pronounced after 'शी'."
    },
    {
      question: "What is the correct antonym of the word 'Ebullient' (meaning cheerful and full of energy)?",
      options: ["Apathetic", "Exuberant", "Vivacious", "Buoyant"],
      correctIndex: 0, // Apathetic
      explanation: "Ebullient means overflowingly enthusiastic or lively. 'Apathetic' means showing or feeling no interest, enthusiasm, or concern, which is the direct antonym."
    },
    {
      question: "Complete the sentence with correct verb form: 'The committee ________ split on their decision regarding the budget allocation.'",
      options: ["was", "were", "has", "is"],
      correctIndex: 1, // were
      explanation: "When a collective noun like 'committee' acts as individuals (indicated by 'split on *their* decision'), the verb must be plural ('were'), not singular."
    }
  ]
};
