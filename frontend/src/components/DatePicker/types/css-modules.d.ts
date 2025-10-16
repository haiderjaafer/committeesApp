
//This is a TypeScript module resolution issue. The CSS file exists but TypeScript doesn't recognize it as a valid import. Here are the solutions

// This will:

// Declare the react-datepicker CSS module
// Declare ALL CSS file imports as valid modules



// types/css-modules.d.ts
declare module 'react-datepicker/dist/react-datepicker.css';
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}




