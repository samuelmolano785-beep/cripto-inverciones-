import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-crypto-card border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-crypto-accent to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-crypto-dark font-bold text-lg">₿</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-wider text-crypto-text leading-none">
                CRIPTO<span className="text-crypto-accent">ORACLE</span>
            </h1>
            <span className="text-[10px] text-crypto-accent font-bold tracking-widest uppercase bg-yellow-900/30 px-1 rounded w-fit mt-1">
                Binance Edition
            </span>
          </div>
        </div>
        <div className="text-sm text-crypto-muted hidden md:block">
          Powered by Gemini 3
        </div>
      </div>
    </nav>
  );
};

export default Navbar;