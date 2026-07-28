// src/modules/auth/LoginPage.tsx
import React from "react";
import Link from "next/link";

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-start w-full bg-white">
      {/* Hero Section */}
      {/* Giảm chiều cao trên mobile xuống 50vh, giữ 750px trên desktop */}
      <div className="relative w-full h-[50vh] min-h-[400px] md:h-[750px] flex justify-center items-center overflow-hidden bg-black">
        {/* Background Images Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-black/50 z-10" />
          <img 
            src="/assets/ImageAsset6.png" 
            alt="Background" 
            className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
          />
           <img 
            src="/assets/ImageAsset3.png" 
            alt="Decoration Right" 
            className="absolute top-0 right-0 h-full w-auto object-cover z-20 hidden lg:block"
          />
           <img 
            src="/assets/ImageAsset4.png" 
            alt="Decoration Left" 
            className="absolute top-0 left-0 h-full w-auto object-cover z-10 hidden lg:block"
          />
        </div>
      </div>

      {/* Login Form Section */}
      {/* Padding container px-4 để tránh sát lề màn hình */}
      <div className="relative z-30 -mt-[60px] md:-mt-[100px] mb-20 flex justify-center w-full px-4">
        {/* Giảm padding p-6 trên mobile, p-12 trên md */}
        <div className="w-full max-w-[1110px] bg-black p-6 md:p-12 flex flex-col items-center gap-6 shadow-2xl border-t-2 border-coffee-primary/20">
          
          {/* Title */}
          <div className="w-full flex justify-start pb-1">
            <h2 className="font-josefin text-xl md:text-[24px] text-white uppercase leading-tight font-normal">
              Login
            </h2>
          </div>

          {/* Form Content */}
          <div className="w-full flex flex-col items-start gap-4">
            
            {/* Email Field */}
            <div className="w-full">
              <label className="font-poppins text-sm md:text-[15px] font-light text-white leading-[27px] block mb-2">
                Email
              </label>
              <div className="w-full h-[50px] md:h-[58px] border border-white/30 focus-within:border-coffee-primary px-4 flex items-center transition-colors">
                 <input 
                    type="email" 
                    placeholder="Email"
                    className="w-full bg-transparent border-none outline-none text-white font-poppins font-light text-[14px] placeholder-white/40"
                 />
              </div>
            </div>

            {/* Password Field */}
            <div className="w-full">
              <label className="font-poppins text-sm md:text-[15px] font-light text-white leading-[27px] block mb-2">
                Password
              </label>
              <div className="w-full h-[50px] md:h-[58px] border border-white/30 focus-within:border-coffee-primary px-4 flex items-center transition-colors">
                 <input 
                    type="password" 
                    placeholder="Password"
                    className="w-full bg-transparent border-none outline-none text-white font-poppins font-light text-[14px] placeholder-white/40"
                 />
              </div>
            </div>

            {/* Links */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <Link href="#" className="font-poppins text-sm font-light text-coffee-primary hover:text-[#b08b55] transition-colors whitespace-nowrap">
                Forgot Password
              </Link>
              <span className="hidden sm:inline text-white/20">|</span>
              <Link href="/register" className="font-poppins text-sm font-light text-coffee-primary hover:text-[#b08b55] transition-colors whitespace-nowrap">
                Don&apos;t have an Account
              </Link>
            </div>

            {/* Login Button */}
            <div className="w-full mt-6">
              <button className="w-full h-[54px] bg-coffee-primary border border-coffee-primary flex items-center justify-center hover:bg-transparent hover:text-coffee-primary transition-all duration-300 group">
                <span className="font-poppins text-sm font-medium text-black group-hover:text-coffee-primary uppercase tracking-wider">
                  Login
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;