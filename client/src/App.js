import React, { Component } from "react";

import { SantaForm } from "./components";
import logo from "./logo.svg";

import "normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "./App.scss";
import { guidGenerator } from "./utils";
import SubmitBtn from "./components/SubmitBtn";

import { Classes, Dialog } from "@blueprintjs/core";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [
        {
          id: guidGenerator(),
          name: "",
          email: "",
          noMatch: []
        }
      ],
      modal: {
        isOpen: false
      }
    };
  }

  onTextChange = (row, field, val) => {
    this.setState(state => ({
      users: [
        ...state.users.slice(0, row),
        Object.assign({}, this.state.users[row], {
          [field]: val
        }),
        ...state.users.slice(row + 1, state.users.length)
      ]
    }));
  };

  addUser = e => {
    e.preventDefault();
    this.setState(state => ({
      users: [
        ...state.users,
        {
          id: guidGenerator(),
          name: "",
          email: "",
          noMatch: []
        }
      ]
    }));
  };

  sendData = e => {
    e.preventDefault();
    fetch("/santa-api/genMatches", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "post",
      body: JSON.stringify(this.state.users)
    })
      .then(function(response) {
        return response.json();
      })
      .then(data => {
        if (data.msg) {
          this.setState(state => ({
            ...state,
            modal: {
              isOpen: true,
              body: data.msg
            }
          }));
        }
      });
  };

  closeModal = () => {
    this.setState(state => ({
      ...state,
      modal: {
        ...state.modal,
        isOpen: false
      }
    }));
  };

  render() {
    const { users, modal } = this.state;
    return (
      <>
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="logo-text">&#0040;Secret Santa Generator&#0041;</h1>
          </header>
          <SubmitBtn onClick={this.sendData} />
          <SantaForm
            users={users}
            addUser={this.addUser}
            onTextChange={this.onTextChange}
          />
        </div>
        <Dialog
          title="Secret Santa Says..."
          className="bp3-dark"
          isOpen={modal.isOpen}
          onClose={this.closeModal}
        >
          <div className={Classes.DIALOG_BODY}>
            <p>{modal.body}</p>
          </div>
        </Dialog>
      </>
    );
  }
}

export default App;
