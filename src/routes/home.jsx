import React from "react";
import * as THREE from "three";
import GLOBE from "vanta/dist/vanta.globe.min.js";
import CLOUDS from "vanta/dist/vanta.clouds.min.js";

import { Link } from "react-router-dom";

class HomePage extends React.Component {
  constructor() {
    super();
    this.vantaRef = React.createRef();
  }
  componentDidMount() {
    // this.vantaEffect = GLOBE({
    //   el: this.vantaRef.current,
    //   THREE: THREE,
    //   mouseControls: true,
    //   touchControls: true,
    //   gyroControls: false,
    //   minHeight: 200.0,
    //   minWidth: 200.0,
    //   scale: 1.0,
    //   scaleMobile: 1.0,
    //   size: 0.6,
    //   color: 0xfff33f,
    // });

    this.vantaEffect = CLOUDS({
      el: this.vantaRef.current,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
    });
  }
  componentWillUnmount() {
    if (this.vantaEffect) {
      this.vantaEffect.destroy();
    }
  }
  render() {
    return (
      <div style={{ height: "100vh", width: "100%" }} ref={this.vantaRef}>
        <main className="h-screen grid md:grid-cols-12 container mx-auto px-8 gap-x-10 md:place-items-center pb-10 lg:pb-0 min-h-[42.5rem]">
          <div className="md:col-span-6 text-white my-14 lg:my-0">
            <h1 className="capitalize text-6xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600 ">
              Rally
            </h1>
            <p className="mt-4 mb-10 max-w-lg leading-relaxed text-neutral-100 font-light">
              Create custom itineraries, discover new routes, find interesting
              landmarks, and get directions to your destinations - all in one
              place.
            </p>
            <Link
              to="/map"
              className="inline-block capitalize font-medium text-lg bg-gradient-to-r from-yellow-400 to-pink-600 text-white px-8 py-2 rounded-full hover:from-yellow-500 hover:to-pink-700 hover:ring-2 hover:ring-yellow-400 hover:ring-offset-2 hover:ring-offset-white"
            >
              try it out
            </Link>
          </div>
          {/* <img
            src="/map-cuate.svg"
            alt="map"
            className="md:col-span-6 max-w-full"
          /> */}
        </main>
      </div>
    );
  }
}

export default HomePage;
