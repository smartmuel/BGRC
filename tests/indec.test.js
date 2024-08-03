const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let dom;
let window;
let document;

beforeAll(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  window = dom.window;
  document = window.document;

  // Mock fetch API
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(['Example 1', 'Example 2']),
    })
  );

  // Mock URL.createObjectURL and URL.revokeObjectURL
  global.URL.createObjectURL = jest.fn();
  global.URL.revokeObjectURL = jest.fn();

  // Mock FileReader
  global.FileReader = class {
    readAsText() {
      this.onload({ target: { result: JSON.stringify([{ name: 'Test Resource', count: 5 }]) } });
    }
  };

  // Expose window methods globally
  global.addResource = window.addResource;
  global.importData = window.importData;
});

test('Initial render', () => {
  expect(document.querySelector('h1').textContent).toBe('Board Game Resource Counter');
  expect(document.getElementById('resources').children.length).toBe(0);
});

test('Add resource', () => {
  window.addResource();
  expect(document.getElementById('resources').children.length).toBe(1);
});

test('Update resource count', () => {
  const incrementButton = document.querySelector('.counter-buttons button:last-child');
  incrementButton.click();
  const countSpan = document.querySelector('.counter span');
  expect(countSpan.textContent).toBe('1');
});

test('Remove resource', () => {
  const removeButton = document.querySelector('.remove-button');
  window.confirm = jest.fn(() => true); // Mock confirm dialog
  removeButton.click();
  expect(document.getElementById('resources').children.length).toBe(0);
});

test('Toggle global settings visibility', () => {
  const settingsButton = document.querySelector('#globalSettings button');
  settingsButton.click();
  const settingsContent = document.getElementById('globalSettingsContent');
  expect(settingsContent.style.display).toBe('block');
});

test('Toggle hide all except resources', () => {
  const hideAllCheckbox = document.getElementById('hideAllExceptResources');
  hideAllCheckbox.click();
  const controlsContainer = document.getElementById('controlsContainer');
  expect(controlsContainer.style.display).toBe('none');
});

test('Populate example dropdown', async () => {
  await window.populateExampleDropdown();
  const exampleSelect = document.getElementById('exampleSelect');
  expect(exampleSelect.children.length).toBe(3); // Including the default option
});

test('Export data', () => {
  const exportButton = document.getElementById('exportButton');
  const createElementSpy = jest.spyOn(document, 'createElement');
  exportButton.click();
  expect(createElementSpy).toHaveBeenCalledWith('a');
});

test('Import data', (done) => {
  const importFile = document.getElementById('importFile');
  const event = { target: { files: [new File([], 'test.json')] } };
  window.importData(event);
  
  setTimeout(() => {
    expect(document.getElementById('resources').children.length).toBe(1);
    const resourceName = document.querySelector('.resource-name-container input').value;
    expect(resourceName).toBe('Test Resource');
    done();
  }, 0);
});
