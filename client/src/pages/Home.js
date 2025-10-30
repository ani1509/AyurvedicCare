import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Stethoscope,
  Clock,
  Star,
  Shield,
  Users,
  ArrowRight,
  Video,
} from "lucide-react";

const Home = () => {
  const { isAuthenticated, isPatient } = useAuth();

  const features = [
    {
      icon: Stethoscope,
      title: "Expert Ayurvedic Doctors",
      description:
        "Connect with qualified and experienced Ayurvedic practitioners",
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description:
        "Book appointments at your convenience with 24/7 availability",
    },
    {
      icon: Video,
      title: "Online Consultations",
      description: "Get consultations from the comfort of your home",
    },
    {
      icon: Star,
      title: "Verified Reviews",
      description: "Read authentic reviews from real patients",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health information is protected with highest security",
    },
    {
      icon: Users,
      title: "Personalized Care",
      description: "Receive personalized treatment plans based on your needs",
    },
  ];

  const stats = [
    { number: "500+", label: "Expert Doctors" },
    { number: "10,000+", label: "Happy Patients" },
    { number: "50,000+", label: "Consultations" },
    { number: "4.8", label: "Average Rating" },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-br from-ayurvedic-50 to-orange-50 rounded-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Health, Our{" "}
            <span className="text-ayurvedic-500">Ayurvedic</span> Care
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with qualified Ayurvedic doctors for personalized
            consultations. Experience the ancient wisdom of Ayurveda for modern
            wellness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated && isPatient ? (
              <Link
                to="/doctors"
                className="btn-primary text-base px-8 py-3 whitespace-nowrap min-w-[160px] text-center"
              >
                Find Doctors
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-base px-8 py-3 whitespace-nowrap w-[160px] h-[48px] text-center flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 text-white" />
                </Link>
                <Link
                  to="/doctors"
                  className="btn-outline text-base px-8 py-3 whitespace-nowrap w-[160px] h-[48px] text-center flex items-center justify-center"
                >
                  Browse Doctors
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-ayurvedic-500 mb-2">
              {stat.number}
            </div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose AyurvedicCare?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We bring together the best of traditional Ayurvedic wisdom with
            modern technology to provide you with comprehensive healthcare
            solutions.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card-hover text-center">
              <div className="w-12 h-12 bg-ayurvedic-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-ayurvedic-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-2xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Getting started with AyurvedicCare is simple and straightforward
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-ayurvedic-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-ayurvedic-500">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Find Your Doctor
            </h3>
            <p className="text-gray-600">
              Browse through our network of qualified Ayurvedic doctors and
              choose the one that best fits your needs.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-ayurvedic-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-ayurvedic-500">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Book Appointment
            </h3>
            <p className="text-gray-600">
              Select a convenient time slot and book your consultation with just
              a few clicks.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-ayurvedic-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-ayurvedic-500">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Get Consultation
            </h3>
            <p className="text-gray-600">
              Connect with your doctor online or visit in-person for a
              personalized Ayurvedic consultation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ayurvedic-500 rounded-2xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Wellness Journey?
        </h2>
        <p className="text-ayurvedic-100 mb-8 max-w-2xl mx-auto">
          Join thousands of patients who have transformed their health with
          AyurvedicCare. Book your first consultation today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated && isPatient ? (
            <Link
              to="/doctors"
              className="bg-white text-ayurvedic-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Find Doctors
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-white text-ayurvedic-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Get Started
              </Link>
              <Link
                to="/doctors"
                className="border border-white text-white hover:bg-white hover:text-ayurvedic-500 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Browse Doctors
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
