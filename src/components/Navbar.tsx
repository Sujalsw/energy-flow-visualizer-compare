
import React from 'react';

const Navbar = () => {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      height: '60px',
      backgroundColor: '#1A2526',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      zIndex: 1000,
      borderBottom: '1px solid #e0e0e0'
    }}>
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/JSW_Group_logo.svg/240px-JSW_Group_logo.svg.png"
        alt="JSW Logo"
        style={{
          width: '40px',
          height: '40px',
          marginRight: '10px',
          objectFit: 'contain'
        }}
      />
      <span style={{ fontSize: '18px', fontWeight: '500' }}>
        JSW Mangalore Container Terminal Pvt. Ltd.
      </span>
    </nav>
  );
};

export default Navbar;
