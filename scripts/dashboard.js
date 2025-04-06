
  document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("[data-section]");
    const sections = document.querySelectorAll(".section");

    links.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const sectionId = link.getAttribute("data-section");

        // Hide all sections
        sections.forEach(sec => sec.classList.add("hidden"));

        // Show the clicked section
        const target = document.getElementById(sectionId);
        if (target) {
          target.classList.remove("hidden");
        }

        // Optional: Highlight active menu item
        links.forEach(l => l.classList.remove("bg-[#A855F7]", "bg-[#A855F7]"));
        link.classList.add("bg-[#A855F7]", "bg-[#A855F7]");
      });
    });

    // Show default section (e.g., dashboard)
    document.getElementById("dashboard").classList.remove("hidden");
  });
