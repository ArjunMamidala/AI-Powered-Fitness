import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import Home from "./pages/Home"
import Classes from "./pages/Classes"
import Contact from './pages/Contact'
import Memberships from './pages/Memberships'
import Trainers from './pages/Trainers'
import Dashboard from './pages/Dashboard'
import ClassDetails from './pages/ClassDetails';
import NutritionPlan from './pages/NutritionPlan';
import FormChecker from './pages/FormChecker';
import FindGyms from './pages/FindGyms'

const App = () => {
  return (
    <div>
      <Navbar />
      <div className='min-h-[70vh]'>
        <Routes>
           <Route path="/" element={<Home />} />
           {/* Add other routes as needed */}
           <Route path="/classes" element={<Classes/>} />
           <Route path="/Dashboard" element={<Dashboard/>} />
           <Route path="/memberships" element={<Memberships/>} />
           <Route path="/trainers" element={<Trainers/>} />
           <Route path="/about" element={<div>About Page</div>} />
           <Route path="/contact" element={<Contact/>} />
           <Route path="/classes/:id" element={<ClassDetails />} />
           <Route path="/nutrition" element={<NutritionPlan />} />
           <Route path="/form-checker" element={<FormChecker />} />
           <Route path="/find-gyms" element={<FindGyms />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
