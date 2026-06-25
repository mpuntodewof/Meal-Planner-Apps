import React from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './sub-comp/Banner';
import Navbar from './sub-comp/Navbar';
// let logoImg = require("../img/logo.png");


function Header() {
  const navigate = useNavigate();
  
  return (
    <>
        <Navbar />
        <Banner />
    </>    
  );
};

export default Header;