import { Density } from "./types";

type SpacingKnobs = {
  SECTIONTITLEVSPACE: string;
  SECTIONRULEVSPACE: string;
  SUBHEADINGVSPACE: string;
  BULLETENDVSPACE: string;
  ITEMTEXTVSPACE: string;
};

const DENSITY_SPACING: Record<Density, SpacingKnobs> = {
  normal: {
    SECTIONTITLEVSPACE: "-10pt",
    SECTIONRULEVSPACE: "-5pt",
    SUBHEADINGVSPACE: "7pt",
    BULLETENDVSPACE: "-2pt",
    ITEMTEXTVSPACE: "-2pt",
  },
  tight: {
    SECTIONTITLEVSPACE: "-11pt",
    SECTIONRULEVSPACE: "-6pt",
    SUBHEADINGVSPACE: "5pt",
    BULLETENDVSPACE: "-3pt",
    ITEMTEXTVSPACE: "-3pt",
  },
};

export const renderPreamble = (density: Density = "normal"): string => {
  const spacing = DENSITY_SPACING[density] ?? DENSITY_SPACING.normal;

  return `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}


%----------FONT OPTIONS----------
% sans-serif
% \\usepackage[sfdefault]{FiraSans}
% \\usepackage[sfdefault]{roboto}
% \\usepackage[sfdefault]{noto-sans}
% \\usepackage[default]{sourcesanspro}

% serif
% \\usepackage{CormorantGaramond}
% \\usepackage{charter}


\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\newcommand{\\SECTIONTITLEVSPACE}{${spacing.SECTIONTITLEVSPACE}}
\\newcommand{\\SECTIONRULEVSPACE}{${spacing.SECTIONRULEVSPACE}}
\\newcommand{\\SUBHEADINGVSPACE}{${spacing.SUBHEADINGVSPACE}}
\\newcommand{\\BULLETENDVSPACE}{${spacing.BULLETENDVSPACE}}
\\newcommand{\\ITEMTEXTVSPACE}{${spacing.ITEMTEXTVSPACE}}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{\\SECTIONTITLEVSPACE}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{\\SECTIONRULEVSPACE}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{\\ITEMTEXTVSPACE}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-6pt}}

\\newcommand{\\LeftRight}[2]{%
  \\begin{tabular*}{\\linewidth}{@{\\extracolsep{\\fill}} p{0.75\\linewidth} r}
    #1 & #2 \\\\
  \\end{tabular*}
}

\\newcommand{\\Bitem}[1]{%
  \\par\\hangindent=2.4em\\hangafter=1
  \\noindent\\hspace{1em}%
  \\makebox[1.4em][l]{\\raisebox{0.2ex}{\\scriptsize$\\bullet$}}#1\\\\[\\BULLETENDVSPACE]%
}

\\newcommand{\\BitemEd}[1]{%
  \\hangindent=2.4em\\hangafter=1
  \\hspace{1em}%
  \\makebox[1.4em][l]{\\raisebox{0.2ex}{\\scriptsize$\\bullet$}}%
  #1%
}


%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%
`;
};
