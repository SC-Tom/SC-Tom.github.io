const startButton = document.querySelector('#startButton');

const hideHiddenFields = () => {
    const questionsEl = document.querySelector('.questions');
    const jumbotronEl = document.querySelector('.jumbotron');
    questionsEl.style.display = 'block';
    jumbotronEl.style.display = 'none';
}

if (startButton) {
    startButton.addEventListener('click', () => {
        hideHiddenFields();
    }, false);
}