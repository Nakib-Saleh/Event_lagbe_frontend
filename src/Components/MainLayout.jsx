import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
    return (
        <div className='min-h-screen'>
            <header>
                <NavBar></NavBar>
            </header>
            <main>
                <Outlet></Outlet>
            </main>
            <div className='sticky top-full'>
                <Footer></Footer>
            </div>
            <Toaster position="top-right"  />
        </div>
    );
};

export default MainLayout;