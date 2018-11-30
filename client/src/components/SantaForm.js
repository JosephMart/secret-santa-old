import React from 'react';

import Select from 'react-select';
import plus from "../icons/plus.svg";
import {getOptions, getSelectValues} from "../utils";

function SantaRow({id, name, email, options, onTextChange, row, selectValues}) {
  return (
    <tr>
      <td>
        <input
          type="text"
          value={name}
          onChange={e => onTextChange(row, "name", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          value={email}
          onChange={e => onTextChange(row, "email", e.target.value)}
        />
      </td>
      <td>
        <Select
          placeholder="Does not match with"
          className="select"
          value={selectValues}
          options={options}
          onChange={d => onTextChange(row, "noMatch", d.map(i => i.value))}
          isMulti
        />
      </td>
    </tr>
  );
}

function SantaForm({users, addUser, onTextChange}) {
  const SantaUsers = users.map((u, i) => (
    <SantaRow
      key={u.id}
      row={i}
      options={getOptions(u.id, users)}
      selectValues={getSelectValues(u.noMatch, users)}
      onTextChange={onTextChange}
      {...u}
    />
  ));

  return (
    <section id="SantaForm">
      <div className="tbl-content">
        <table cellPadding="0" cellSpacing="0" border="0">
          <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Does not match with</th>
          </tr>
          </thead>
          <tbody>
          {SantaUsers}
          <tr className="add-row" onClick={addUser}>
            <td colSpan="3" align="center">
              <img src={plus} className="plus-icon" alt="plus-icon"/>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

SantaForm.defaultProps = {
  users: [],
};

export default SantaForm;
