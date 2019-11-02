import React, { Component } from "react";

import { SantaForm } from "./components";
import logo from "./logo.svg";
import "./App.scss";
import { guidGenerator } from "./utils";
import SubmitBtn from "./components/SubmitBtn";

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
      ]
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
      .then(function(data) {
        if (data.msg) alert(data.msg);
      });
  };

  render() {
    const { users } = this.state;
    return (
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
    );
  }
}

export default App;
