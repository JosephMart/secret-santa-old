import React from 'react';

function SubmitBtn({onClick}) {
    return (
      <div id="#SubmitBtn" className="bg">
          <div className="centerer">
              <button className="button" onClick={onClick}>Generate</button>
          </div>
      </div>
    );
}

export default SubmitBtn;
