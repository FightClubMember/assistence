// ATS Resume Architect (Layer E)
// Manages the 6-Phase sequential extraction interview and compiles LaTeX/Markdown output.

const activeResumes = new Map();

export const RESUME_PHASES = {
  1: {
    title: "Phase 1: Personal Coordinates & Headline",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 1 OF 6**
---
Provide your contact details and professional headline.
**Required Input Format:**
\`\`\`text
[Full Name]
[Email Address] | [Phone Number] | [Location]
[LinkedIn Profile URL or GitHub]
[Professional Headline - e.g., UPSC CSE Aspirant / Quantitative Analyst]
\`\`\`
*(Send your details in a single message to proceed)*`
  },
  2: {
    title: "Phase 2: Professional / Academic Summary",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 2 OF 6**
---
Provide an action-verb heavy Professional or Academic Summary. Highlight your primary academic interests, discipline metrics, and competitive drive.
**Example:**
_"Driven and analytically rigorous Bachelor of Technology graduate with a strong foundation in Quantitative Aptitude and Indian Polity. Demonstrated capability in complex logical transformations, targeting national-level administrative positions. Highly disciplined, maintaining consistent learning metrics under stress."_`
  },
  3: {
    title: "Phase 3: Academic History",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 3 OF 6**
---
Provide your Academic History in descending chronological order.
Include: Degree, Institution, Year of Passing, and GPA / Percentage.
**Required Input Format:**
\`\`\`text
[Degree/Exam] | [Institution/Board] | [Passing Year] | [GPA or %]
\`\`\`
*(You can list multiple rows, one per line)*`
  },
  4: {
    title: "Phase 4: Categorized Skill Matrix",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 4 OF 6**
---
Provide your skills classified into:
1. **Core Competencies** (e.g., Indian History, Public Policy, Analytical Reasoning)
2. **Technical Skills** (e.g., Python, LaTeX, Excel, SQL)
3. **Languages** (e.g., Hindi, English, Sanskrit)
**Format:**
\`\`\`text
Core Competencies: [skills...]
Technical Skills: [skills...]
Languages: [languages...]
\`\`\`
`
  },
  5: {
    title: "Phase 5: Projects, Papers & Exam Benchmarks",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 5 OF 6**
---
Provide academic projects, research papers, or competitive exam benchmarks (e.g., SSC CGL Tier 1 qualified with score, UPSC Pre marks, college research papers).
**Format:**
\`\`\`text
[Project or Exam name]: [Details, scores, or achievements]
\`\`\`
`
  },
  6: {
    title: "Phase 6: Leadership & Experience",
    prompt: `🔍 **ATS RESUME ARCHITECT: PHASE 6 OF 6**
---
Provide internship details, institutional leadership (e.g., class representative, club lead), or work experience.
**Format:**
\`\`\`text
[Organization] | [Role] | [Duration]
- [Key achievement using action verbs]
- [Key achievement using action verbs]
\`\`\`
`
  }
};

export function startResume(userId) {
  const state = {
    phase: 1,
    data: {}
  };
  activeResumes.set(userId, state);
  return RESUME_PHASES[1].prompt;
}

export function getResumeState(userId) {
  return activeResumes.get(userId);
}

export function clearResume(userId) {
  activeResumes.delete(userId);
}

export function savePhaseData(userId, text) {
  const state = activeResumes.get(userId);
  if (!state) return null;

  state.data[`phase${state.phase}`] = text;
  state.phase += 1;

  if (RESUME_PHASES[state.phase]) {
    return {
      done: false,
      nextPrompt: RESUME_PHASES[state.phase].prompt
    };
  } else {
    // Compiled
    const output = compileResume(state.data);
    clearResume(userId);
    return {
      done: true,
      resumeMarkdown: output.markdown,
      resumeLatex: output.latex
    };
  }
}

function compileResume(data) {
  // Parse personal details
  const p1 = (data.phase1 || "").split("\n");
  const name = p1[0] || "ACADEMIC CANDIDATE";
  const contact = p1[1] || "email@domain.com | +91-0000000000 | New Delhi, India";
  const links = p1[2] || "linkedin.com/in/username";
  const headline = p1[3] || "Strategic Aspirant";

  const summary = data.phase2 || "Results-driven academic candidate with focus on national competitive frameworks.";
  const academics = data.phase3 || "Degree | Institution | Year | Marks";
  const skills = data.phase4 || "Core skills listed here.";
  const projects = data.phase5 || "Competitive achievements listed here.";
  const experience = data.phase6 || "No previous experience listed.";

  const markdown = `
# RESUME: ${name.toUpperCase()}
**${headline}**
${contact} | ${links}

---
### **PROFESSIONAL SUMMARY**
${summary}

---
### **ACADEMIC HISTORY**
${academics.split("\n").map(line => `* ${line}`).join("\n")}

---
### **SKILL MATRIX**
${skills}

---
### **BENCHMARKS & PROJECTS**
${projects}

---
### **EXPERIENCE & LEADERSHIP**
${experience}
`;

  // LaTeX code optimized for Overleaf
  const latex = `% --- ATS COMPLIANT OVERLEAF LATEX SOURCE CODE ---
\\documentclass[10pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.75in}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{${name}}}\\\\
    \\vspace{2pt}
    \\textit{${headline}}\\\\
    \\vspace{2pt}
    ${contact} | \\href{https://${links.replace("https://", "").replace("http://", "")}}{${links}}
\\end{center}

\\section{Professional Summary}
${summary}

\\section{Education}
\\begin{itemize}[leftmargin=*]
${academics.split("\n").map(line => {
  const parts = line.split("|").map(p => p.trim());
  if (parts.length >= 3) {
    return `    \\item \\textbf{${parts[0]}} -- ${parts[1]} (${parts[2]}) \\hfill \\textit{${parts[3] || ""}}`;
  }
  return `    \\item ${line}`;
}).join("\n")}
\\end{itemize}

\\section{Skills}
${skills.split("\n").map(line => `\\noindent ${line}\\\\`).join("\n")}

\\section{Projects \\& Academic Benchmarks}
\\begin{itemize}[leftmargin=*]
${projects.split("\n").map(line => `    \\item ${line}`).join("\n")}
\\end{itemize}

\\section{Experience \\& Leadership}
\\begin{itemize}[leftmargin=*]
${experience.split("\n").map(line => {
  if (line.startsWith("-")) {
    return `    \\item[] ${line}`;
  }
  return `    \\item \\textbf{${line}}`;
}).join("\n")}
\\end{itemize}

\\end{document}
`;

  return { markdown, latex };
}
