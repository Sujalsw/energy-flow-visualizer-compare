
import React from 'react';

const Navbar = () => {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      height: '60px',
      backgroundColor: '#1E3A5F',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      zIndex: 1000,
      borderBottom: '1px solid #2A4B7C'
    }}>
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/JSW_Group_logo.svg/240px-JSW_Group_logo.svg.png"
        alt="JSW Logo"
        style={{
          width: '40px',
          height: '40px',
          objectFit: 'contain'
        }}
      />
      <div style={{
        flex: 1,
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: '500',
        fontFamily: 'Roboto, sans-serif'
      }}>
        JSW Mangalore Container Terminal Pvt. Ltd.
      </div>
    </nav>
  );
};

export default Navbar;
