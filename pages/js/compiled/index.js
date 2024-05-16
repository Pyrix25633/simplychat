"use strict";
class Chat {
    constructor() {
    }
    appendTo(sidebar) {
    }
}
class Sidebar {
    constructor() {
        this.sidebar = document.createElement('div');
    }
    appendChild(node) {
        this.sidebar.appendChild(node);
    }
    expand(expand) {
        this.sidebar.style.display = expand ? '' : 'flex';
    }
}
class Topbar {
    constructor(chats, users) {
        this.expanded = '';
        this.chats = chats;
        this.expandChats = document.createElement('img');
        this.expandChats.classList.add('button');
        this.logo = document.createElement('img');
        this.logo.classList.add('topbar-logo');
        this.name = document.createElement('span');
        this.name.classList.add('topbar-name');
        this.description = document.createElement('span');
        this.description.classList.add('topbar-description');
        this.users = users;
        this.expandUsers = document.createElement('img');
        this.expandUsers.classList.add('button');
    }
    appendTo(main) {
    }
    set(name, description, logo) {
        this.name.innerText = name;
        this.description.innerText = description;
        this.logo.src = logo;
    }
    expand(sidebar) {
        if (this.expanded == sidebar)
            return;
        if (this.expanded == '') {
            if (sidebar == 'chats') {
                this.expandUsers.src = '/img/collapse.svg';
                this.chats.expand(true);
            }
            else {
                this.expandChats.src = '/img/collapse.svg';
                this.users.expand(true);
            }
            this.expanded = sidebar;
        }
        else {
            if (this.expanded == 'chats') {
                this.expandUsers.src = '/img/expand-left.svg';
                this.chats.expand(false);
            }
            else {
                this.expandChats.src = '/img/expand-right.svg';
                this.users.expand(false);
            }
            this.expanded = '';
        }
    }
}
class Main {
    constructor() {
        this.chats = new Sidebar();
        this.users = new Sidebar();
        this.topbar = new Topbar(this.chats, this.users);
    }
    appendTopbar(node) {
    }
}
