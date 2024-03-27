import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QDialog, QScrollArea } from '@nodegui/nodegui';
import { checkRepo } from "./repoCheck";

const win = new QMainWindow();
win.setWindowTitle("Student codechecker");

const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const label = new QLabel();
label.setObjectName("mylabel");
label.setText("Welcome to Student codechecker");
const label3 = new QLabel();
label3.setObjectName("mylabel2");
label3.setText("Struggling minds seek help,\nEditing woes, prints erased,\nForgotten variables.");
label3.setInlineStyle(`font-size: 25px; min-height: 200px; text-align: center;`);

const searchContainer = createSearchContainer((text) => {
  checkRepo(text);
});

function createSearchContainer(onSearch : (text: string) => void){
  const searchContainer = new QWidget();
  searchContainer.setObjectName('searchContainer');
  searchContainer.setInlineStyle('font-size: 20px; min-height: 30px; min-width: 300px; display:');

  const searchInput = new QLineEdit();
  searchInput.setObjectName('searchInput');
  searchInput.setInlineStyle('font-size: 20px; min-height: 30px; min-width: 300px;');

  const searchButton = new QPushButton();
  searchButton.setObjectName('searchButton');
  searchButton.setText("Click me!");
  searchButton.setInlineStyle('font-size: 20px; min-height: 30px; min-width: 100px')

  searchButton.addEventListener('clicked', () => {
    onSearch(searchInput.text());
  });

  const layout = new FlexLayout();
  searchContainer.setLayout(layout);
  layout.addWidget(searchInput);
  layout.addWidget(searchButton);

  return searchContainer;
}

const label2 = new QLabel();
label2.setText("Copy paste an url for a git repository\n and press the button to check it");
label2.setInlineStyle(`font-size: 25px; padding-bottom: 30px; padding-top: 30px;`);

export function createResultWindow(results: string) {
  const resultWindow = new QDialog();
  resultWindow.setWindowTitle("Code Check Results");

  const scrollArea = new QScrollArea();
  scrollArea.setObjectName("scrollArea");
  scrollArea.setInlineStyle(`
      width: '100%';
      height: '100%';
  `);

  const resultLabel = new QLabel();
  resultLabel.setObjectName("resultLabel");
  resultLabel.setInlineStyle(`
      flex: 1;
      font-size: 20px;
  `);
  resultLabel.setText(results);

  scrollArea.setWidget(resultLabel);

  const layout = new FlexLayout();
  resultWindow.setLayout(layout);
  layout.addWidget(scrollArea);
  resultWindow.setMinimumSize(1200, 800);
  resultWindow.show();
}



rootLayout.addWidget(label);
rootLayout.addWidget(label3);
rootLayout.addWidget(searchContainer);
rootLayout.addWidget(label2);
win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #myroot {
      flex: 1;
      background-color: #33C1FF;
      font-shadow: 10px;
      align-items: 'center';
      justify-content: 'center';
    }
    #mylabel {
      flex: 1;
      font-size: 30px;
      font-weight: bold;
      padding-top: 15px;
    }
    #view {
      flex: 3;
    }
  `
);
win.show();

(global as any).win = win;