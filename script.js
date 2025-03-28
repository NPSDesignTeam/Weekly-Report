document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded and parsed");

  // Bold and Highlight Buttons
  const boldButtons = document.querySelectorAll('.boldBtn');
  const highlightButtons = document.querySelectorAll('.highlightBtn');

  boldButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-target');
      const target = document.getElementById(targetId);
      target.focus();
      document.execCommand('bold', false, null);
    });
  });

  highlightButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-target');
      const target = document.getElementById(targetId);
      target.focus();
      document.execCommand('hiliteColor', false, '#fffca1');
    });
  });

  // Element references
  const editingSection = document.getElementById('editing');
  const previewSection = document.getElementById('preview');
  const previewContainer = document.getElementById('previewContainer');
  const submitBtn = document.getElementById('submitBtn');
  const approveBtn = document.getElementById('approveBtn');
  const editBtn = document.getElementById('editBtn');
  const startOverBtn = document.getElementById('startOverBtn');

  // Button Event Listeners
  submitBtn.addEventListener('click', function () {
    console.log("Submit button clicked");
    generatePreview();
    editingSection.style.display = 'none';
    previewSection.style.display = 'block';
  });

  editBtn.addEventListener('click', function () {
    previewSection.style.display = 'none';
    editingSection.style.display = 'block';
  });

  startOverBtn.addEventListener('click', function () {
    const editables = document.querySelectorAll('.editable');
    editables.forEach(el => { el.innerHTML = ''; });
    previewSection.style.display = 'none';
    editingSection.style.display = 'block';
  });

  approveBtn.addEventListener('click', function () {
    generatePDF();
  });

  // Helper: Create a new page with header, content area, and footer for page numbering
  function createPage(title, date, pageNumber, totalPages) {
    const page = document.createElement('div');
    page.className = 'page';

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<h2>${title}</h2><span>${date}</span>`;

    const content = document.createElement('div');
    content.className = 'page-content';

    const footer = document.createElement('div');
    footer.className = 'page-footer';
    footer.textContent = `Page ${pageNumber} of ${totalPages}`;

    page.appendChild(header);
    page.appendChild(content);
    page.appendChild(footer);
    return page;
  }

  // New pagination function that groups blocks based on combined height.
  function paginateBlocks(blocks, title, date) {
    const availableHeight = 936; // allowed content height in px
    const pages = [];
    let currentPageBlocks = [];
    let currentHeight = 0;

    // Create a temporary container to measure heights without affecting the live DOM.
    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'absolute';
    tempContainer.style.width = '8.5in';
    document.body.appendChild(tempContainer);

    blocks.forEach(block => {
      // Clone block for measurement
      const clone = block.cloneNode(true);
      tempContainer.appendChild(clone);
      const blockHeight = clone.getBoundingClientRect().height;
      tempContainer.removeChild(clone);

      // If adding this block would exceed availableHeight, finalize current page.
      if (currentHeight + blockHeight > availableHeight && currentPageBlocks.length > 0) {
        pages.push(buildPageFromBlocks(currentPageBlocks, title, date, pages.length + 1, 1));
        currentPageBlocks = [];
        currentHeight = 0;
      }
      currentPageBlocks.push(block);
      currentHeight += blockHeight;
    });

    // Add remaining blocks as final page.
    if (currentPageBlocks.length > 0) {
      pages.push(buildPageFromBlocks(currentPageBlocks, title, date, pages.length + 1, 1));
    }
    document.body.removeChild(tempContainer);
    return pages;
  }

  // Helper: Build a page from an array of blocks.
  function buildPageFromBlocks(blocks, title, date, pageNumber, totalPages) {
    const page = createPage(title, date, pageNumber, totalPages);
    const contentContainer = page.querySelector('.page-content');
    blocks.forEach(block => {
      contentContainer.appendChild(block);
    });
    return page;
  }

  // Build employee blocks (each employee's block remains together)
  function buildEmployeeBlocks() {
    const employeeList = [
      { id: 'anderson', name: 'Anderson Galindo' },
      { id: 'candela', name: 'Candela Calvo' },
      { id: 'daniel', name: 'Daniel Leandro' },
      { id: 'franco', name: 'Franco Sant' },
      { id: 'josefina', name: 'Josefina Cisneros' },
      { id: 'lucia', name: 'Lucia Berterreix' },
      { id: 'marcosSofia', name: 'Marcos & Sofia' },
      { id: 'pilar', name: 'Pilar Figueras' },
      { id: 'sarah', name: 'Sarah Hersh' },
      { id: 'sofiaSant', name: 'Sofia Santantonin' },
      { id: 'valentina', name: 'Valentina Arinez' },
      { id: 'vanina', name: 'Vanina Manobla' },
      { id: 'victoria', name: 'Victoria Battista' },
    ];
    const blocks = [];
    employeeList.forEach(emp => {
      const el = document.getElementById(emp.id);
      const note = el.innerHTML;
      const block = document.createElement('div');
      block.className = 'preview-employee';
      block.innerHTML = `<h3>${emp.name}</h3><p>${note}</p>`;
      blocks.push(block);
    });
    return blocks;
  }

  // Build projects block (for projects section)
  function buildProjectsBlock() {
    const projectsEl = document.getElementById('projects');
    const projectsText = projectsEl.innerHTML;
    const block = document.createElement('div');
    block.className = 'preview-employee';
    block.innerHTML = `<h3>Projects</h3><p>${projectsText}</p>`;
    return [block];
  }

  // Generate full preview by paginating employee blocks then projects block.
  function generatePreview() {
    const currentDate = new Date().toLocaleDateString();
    previewContainer.innerHTML = '';

    const employeeBlocks = buildEmployeeBlocks();
    const projectBlocks = buildProjectsBlock();

    // Paginate employees first
    const employeePages = paginateBlocks(employeeBlocks, "Employee Reports", currentDate);
    // Paginate projects with title "Projects"
    const projectPages = paginateBlocks(projectBlocks, "Projects", currentDate);
    const allPages = [...employeePages, ...projectPages];
    const totalPages = allPages.length;

    // Update footer numbering and append pages to preview container.
    allPages.forEach((page, index) => {
      const pageNumber = index + 1;
      page.querySelector('.page-footer').textContent = `Page ${pageNumber} of ${totalPages}`;
      previewContainer.appendChild(page);
    });
  }

  // Generate PDF by capturing each preview page with html2canvas and adding to jsPDF.
  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'letter');
    const pages = document.querySelectorAll('#previewContainer .page');
    let promise = Promise.resolve();

    pages.forEach((page, index) => {
      promise = promise.then(() => {
        return html2canvas(page, { scale: 2 }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          if (index > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        });
      });
    });
    promise.then(() => {
      pdf.save('weekly_report.pdf');
    });
  }
});
