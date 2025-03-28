document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded and parsed");

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

  const editingSection = document.getElementById('editing');
  const previewSection = document.getElementById('preview');
  const previewContainer = document.getElementById('previewContainer');
  const submitBtn = document.getElementById('submitBtn');
  const approveBtn = document.getElementById('approveBtn');
  const editBtn = document.getElementById('editBtn');
  const startOverBtn = document.getElementById('startOverBtn');

  submitBtn.addEventListener('click', function () {
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

  function paginateBlocks(blocks, title, date) {
    const PAGE_HEIGHT = 1056; // 11in x 96dpi
    const MARGIN_TOP = 96;   // 1 inch
    const MARGIN_BOTTOM = 96;
    const HEADER_HEIGHT = 60;
    const FOOTER_HEIGHT = 60;
    const SAFETY_BUFFER = 24; // buffer for rounding or minor spacing issues

    const availableHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - HEADER_HEIGHT - FOOTER_HEIGHT - SAFETY_BUFFER;

    const pages = [];
    let currentPageBlocks = [];
    let currentHeight = 0;

    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'absolute';
    tempContainer.style.width = '8.5in';
    tempContainer.style.padding = '0';
    document.body.appendChild(tempContainer);

    blocks.forEach(block => {
      const clone = block.cloneNode(true);
      tempContainer.appendChild(clone);
      const blockHeight = clone.getBoundingClientRect().height;
      tempContainer.removeChild(clone);

      if (currentHeight + blockHeight > availableHeight && currentPageBlocks.length > 0) {
        pages.push(buildPageFromBlocks(currentPageBlocks, title, date, pages.length + 1, 1));
        currentPageBlocks = [];
        currentHeight = 0;
      }

      currentPageBlocks.push(block);
      currentHeight += blockHeight;
    });

    if (currentPageBlocks.length > 0) {
      pages.push(buildPageFromBlocks(currentPageBlocks, title, date, pages.length + 1, 1));
    }

    document.body.removeChild(tempContainer);
    return pages;
  }

  function buildPageFromBlocks(blocks, title, date, pageNumber, totalPages) {
    const page = createPage(title, date, pageNumber, totalPages);
    const contentContainer = page.querySelector('.page-content');
    blocks.forEach(block => {
      contentContainer.appendChild(block);
    });
    return page;
  }

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

  function buildProjectsBlock() {
    const projectsEl = document.getElementById('projects');
    const projectsText = projectsEl.innerHTML;
    const block = document.createElement('div');
    block.className = 'preview-employee';
    block.innerHTML = `<h3>Projects</h3><p>${projectsText}</p>`;
    return [block];
  }

  function generatePreview() {
    const currentDate = new Date().toLocaleDateString();
    previewContainer.innerHTML = '';

    const employeeBlocks = buildEmployeeBlocks();
    const projectBlocks = buildProjectsBlock();

    const employeePages = paginateBlocks(employeeBlocks, "Employee Reports", currentDate);
    const projectPages = paginateBlocks(projectBlocks, "Projects", currentDate);
    const allPages = [...employeePages, ...projectPages];
    const totalPages = allPages.length;

    allPages.forEach((page, index) => {
      const pageNumber = index + 1;
      page.querySelector('.page-footer').textContent = `Page ${pageNumber} of ${totalPages}`;
      previewContainer.appendChild(page);
    });
  }

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

