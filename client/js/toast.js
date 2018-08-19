setupToast = () => {
    if (!document.querySelector('.toast-container')) {
        let main = document.getElementById('maincontent');
        let container = document.createElement('div');

        container.className = 'toast-container';
        main.prepend(container);
    } 
}

removeToast = (toast) => {
    Promise.resolve(toast)
        .then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    toast.classList.add('out');

                    resolve();
                }, 5000);
            });
        })
        .then(() => {
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
}

pushToast = (type, message) => {
    setupToast();

    let container = document.querySelector('.toast-container');
    let toast = document.createElement('div');
    let p = document.createElement('p');

    toast.classList.add('toast');
    toast.classList.add(`toast-${type}`);
    p.innerHTML = message;
    toast.appendChild(p);
    container.prepend(toast);

    removeToast(toast);
}