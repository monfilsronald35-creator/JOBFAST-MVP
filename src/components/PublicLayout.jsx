import React from "react";

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-navy-950 text-white font-sans overflow-x-hidden antialiased">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 sm:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
