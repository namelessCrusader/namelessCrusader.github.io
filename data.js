// All site content lives here. Edit this file to update the page.

const SITE = {
  name: "Nisarg Parikh",
  email: "nisargparikh.cse@gmail.com",
  links: [
    { label: "Email", href: "mailto:nisargparikh.cse@gmail.com" },
    { label: "GitHub", href: "https://github.com/namelessCrusader" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nisargparikh-/" },
    { label: "CV", href: "assets/Nisarg_Parikh_CV.pdf" },
  ],

  // `pixel` is shown by default and `real` on hover/tap. Leave `pixel` as null to generate
  // a pixel-art version of `real` in the browser, or point it at your own pixel-art image.
  photo: {
    real: "assets/me.webp",
    pixel: "assets/me-pixel.webp",
    alt: "Nisarg holding up a very patient cat",
  },

  // Paragraphs for the About section. Basic HTML is allowed.
  about: [
    `Hi! I'm Nisarg, a CS PhD student at <a href="https://www.umass.edu/">UMass Amherst</a>,
     advised by Andrew Lan.
     Before that I did my MS at Northeastern.`,
    `I work on language models: making them <em>know when they don't know</em> (calibration),
     aligning them with preference optimization, and fine-tuning them cheaply. Along the way
     I've also dabbled in federated learning and procedurally generating
     Mario levels.`,
  ],

  news: [
    { date: "2026", text: "Reviewing for NeurIPS '26 (Gold Reviewer), ICML '26 and AAAI '27." },
    { date: "Jan 2026", text: "CATTO preprint is out on arXiv." },
    { date: "Summer 2025", text: "Research intern at Adobe in Bangalore, working on confidence calibration for LLMs." },
    { date: "2025", text: "LookAlike accepted at BEA 2025." },
    { date: "Sep 2024", text: "Started my PhD at UMass Amherst." },
    { date: "2024", text: "Spry (Thinking Forward) accepted at NeurIPS 2024." },
  ],

  publications: [
    {
      title: "CATTO: Balancing Preferences and Confidence in Language Models",
      authors: "Nisarg Parikh, Kunjal Panchal, Ananya Sai, Pannaga Shivaswamy, Andrew Lan",
      venue: "Preprint",
      year: "2026",
      summary: "A calibration-aware, token-level objective that keeps model confidence honest during preference optimization.",
      links: [{ label: "arXiv", href: "https://arxiv.org/abs/2601.23096" }],
    },
    {
      title: "LookAlike: Consistent Distractor Generation in Math MCQs",
      authors: "Nisarg Parikh, Alexander Scarlatos, Nigel Fernandez, Andrew Lan",
      venue: "BEA @ ACL",
      year: "2025",
      summary: "Using preference optimization to generate wrong answer options that are consistent with real student errors.",
      links: [{ label: "Paper", href: "https://aclanthology.org/2025.bea-1.23/" }],
    },
    {
      title: "Thinking Forward: Memory-Efficient Federated Finetuning of Language Models",
      authors: "Kunjal Panchal, Nisarg Parikh, Sunav Choudhary, Yuriy Brun, Hui Guan",
      venue: "NeurIPS",
      year: "2024",
      summary: "Spry: federated fine-tuning of LLMs with forward-mode automatic differentiation.",
      links: [{ label: "Paper", href: "https://proceedings.neurips.cc/paper_files/paper/2024/hash/7fc914993440219b64254e0c27964e11-Abstract-Conference.html" }],
    },
    {
      title: "Flow: Per-Instance Personalized Federated Learning",
      authors: "Kunjal Panchal, Sunav Choudhary, Nisarg Parikh, Lijun Zhang, Hui Guan",
      venue: "NeurIPS",
      year: "2023",
      summary: "Dynamically personalized models to handle statistical heterogeneity across clients.",
      links: [{ label: "Paper", href: "https://proceedings.neurips.cc/paper_files/paper/2023/hash/3baf4eeffad860ca9c54aeab632716b4-Abstract-Conference.html" }],
    },
  ],

  experience: [
    {
      org: "Adobe",
      role: "Research Intern",
      where: "Bangalore, India",
      when: "May – Aug 2025",
      text: "Confidence calibration for Transformer LMs within preference optimization, and calibrated LMs for automated evaluation.",
    },
    {
      org: "Elemental Cognition",
      role: "Data Science / ML Intern",
      where: "New York (Remote)",
      when: "Jun – Aug 2023",
      text: "Built BigQuery analysis tooling, stress-tested NLP systems for failure modes, and worked on a contrastive task for vector search.",
    },
  ],

  projects: [
    {
      title: "Mario with GFlowNets",
      when: "2024",
      text: "Flow Matching and Trajectory Balance GFlowNets that generate Super Mario Bros. levels, with a custom level-generation environment.",
      href: "https://github.com/namelessCrusader/Mario-GFlowNet/",
    },
    {
      title: "Stochastic Wave Function Collapse",
      when: "2024",
      text: "A stochastic take on WFC that learns tile constraints from ASCII Mario levels. The level at the bottom of this page is generated live by a JavaScript port of it.",
      href: "https://github.com/namelessCrusader/Stochastic-Wave-Function-Collapse/",
      demo: { label: "Compare with WFC", href: "swfc.html" },
    },
  ],

  // Hobby cards. `sprite` must match a key in SPRITES (main.js). A `facedown` card is the
  // easter egg trigger: tapping it 5 times opens the training plan (easter-egg.js).
  hobbies: [
    { name: "Cat Enjoyer", type: "Beast / Effect", sprite: "cat", atk: "∞", def: "0",
      text: "If a cat enters the field, all productivity is sent to the Graveyard." },
    { name: "Duelist", type: "Spellcaster / Effect", sprite: "card", atk: "2500", def: "2100",
      text: "Still believes in the heart of the cards. Will talk your ear off about Yu-Gi-Oh." },
    { name: "Retired Adventurer", type: "Warrior / Lv. 1", sprite: "d20", atk: "1", def: "20",
      text: "Survived one short D&D campaign. Currently working up the courage to roll initiative again." },
    { name: "Bookworm", type: "Scholar / Continuous", sprite: "book", atk: "900", def: "1800",
      text: "Draw 1 card. Then read until 3 a.m." },
    { name: "Home Cook", type: "Alchemist / Ritual", sprite: "pot", atk: "1600", def: "1400",
      text: "Tribute some spices to Special Summon dinner. Results may vary." },
    { name: "???", type: "Trap / Face-down", sprite: "card", atk: "?", def: "?", facedown: true,
      text: "Activates on ↑ ↑ ↓ ↓ ← → ← → B A. Also responds to persistent tapping." },
  ],
};
