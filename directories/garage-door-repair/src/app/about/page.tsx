import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About Us - Garage Door Repair Directory | Find Local Garage Door Services`,
  description:
    "Learn about the Garage Door Repair Directory, the trusted online resource for finding licensed, reviewed garage door repair companies across the United States.",
  openGraph: {
    title: "About Us | Garage Door Repair Directory",
    description:
      "The most comprehensive directory of garage door repair companies in the US. Find trusted local pros for installation, repair, and maintenance.",
    url: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="container py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          About Garage Door Repair Directory
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 leading-relaxed">
            Garage Door Repair Directory is the most comprehensive online resource for
            finding trusted, local garage door repair companies across the United States.
            Whether you need emergency garage door repair, a new garage door installation,
            spring replacement, or routine maintenance, our directory connects homeowners
            with qualified professionals in their area.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Finding a reliable garage door repair service shouldn&apos;t be stressful.
            We built this directory to make it easy for homeowners to compare local
            garage door companies, read real customer reviews, and choose the right
            professional for their needs. Every listing in our directory includes
            verified contact information, service details, and ratings from real
            customers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            What We Cover
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our directory features garage door repair professionals who offer a wide
            range of services, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Garage door spring repair and replacement (torsion and extension springs)</li>
            <li>Garage door opener installation and repair</li>
            <li>Broken cable and track repair</li>
            <li>New garage door installation (residential and commercial)</li>
            <li>Garage door panel replacement</li>
            <li>Emergency garage door service (24/7 availability)</li>
            <li>Garage door maintenance and tune-ups</li>
            <li>Smart garage door opener upgrades</li>
            <li>Insulated garage door installation</li>
            <li>Commercial overhead door repair</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Cities We Serve
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We currently feature garage door repair companies in major cities
            across the United States. Browse our city pages to find trusted
            local professionals near you:
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <li><Link href="/ny/new-york" className="text-blue-600 hover:text-blue-700 font-medium">New York, NY</Link></li>
            <li><Link href="/ca/los-angeles" className="text-blue-600 hover:text-blue-700 font-medium">Los Angeles, CA</Link></li>
            <li><Link href="/il/chicago" className="text-blue-600 hover:text-blue-700 font-medium">Chicago, IL</Link></li>
            <li><Link href="/tx/houston" className="text-blue-600 hover:text-blue-700 font-medium">Houston, TX</Link></li>
            <li><Link href="/az/phoenix" className="text-blue-600 hover:text-blue-700 font-medium">Phoenix, AZ</Link></li>
            <li><Link href="/pa/philadelphia" className="text-blue-600 hover:text-blue-700 font-medium">Philadelphia, PA</Link></li>
            <li><Link href="/tx/san-antonio" className="text-blue-600 hover:text-blue-700 font-medium">San Antonio, TX</Link></li>
            <li><Link href="/ca/san-diego" className="text-blue-600 hover:text-blue-700 font-medium">San Diego, CA</Link></li>
            <li><Link href="/tx/dallas" className="text-blue-600 hover:text-blue-700 font-medium">Dallas, TX</Link></li>
            <li><Link href="/tx/austin" className="text-blue-600 hover:text-blue-700 font-medium">Austin, TX</Link></li>
            <li><Link href="/fl/jacksonville" className="text-blue-600 hover:text-blue-700 font-medium">Jacksonville, FL</Link></li>
            <li><Link href="/tx/fort-worth" className="text-blue-600 hover:text-blue-700 font-medium">Fort Worth, TX</Link></li>
            <li><Link href="/oh/columbus" className="text-blue-600 hover:text-blue-700 font-medium">Columbus, OH</Link></li>
            <li><Link href="/nc/charlotte" className="text-blue-600 hover:text-blue-700 font-medium">Charlotte, NC</Link></li>
            <li><Link href="/in/indianapolis" className="text-blue-600 hover:text-blue-700 font-medium">Indianapolis, IN</Link></li>
            <li><Link href="/ca/san-francisco" className="text-blue-600 hover:text-blue-700 font-medium">San Francisco, CA</Link></li>
            <li><Link href="/wa/seattle" className="text-blue-600 hover:text-blue-700 font-medium">Seattle, WA</Link></li>
            <li><Link href="/co/denver" className="text-blue-600 hover:text-blue-700 font-medium">Denver, CO</Link></li>
            <li><Link href="/dc/washington" className="text-blue-600 hover:text-blue-700 font-medium">Washington, DC</Link></li>
            <li><Link href="/tn/nashville" className="text-blue-600 hover:text-blue-700 font-medium">Nashville, TN</Link></li>
            <li><Link href="/ok/oklahoma-city" className="text-blue-600 hover:text-blue-700 font-medium">Oklahoma City, OK</Link></li>
            <li><Link href="/tx/el-paso" className="text-blue-600 hover:text-blue-700 font-medium">El Paso, TX</Link></li>
            <li><Link href="/ma/boston" className="text-blue-600 hover:text-blue-700 font-medium">Boston, MA</Link></li>
            <li><Link href="/or/portland" className="text-blue-600 hover:text-blue-700 font-medium">Portland, OR</Link></li>
            <li><Link href="/nv/las-vegas" className="text-blue-600 hover:text-blue-700 font-medium">Las Vegas, NV</Link></li>
            <li><Link href="/tn/memphis" className="text-blue-600 hover:text-blue-700 font-medium">Memphis, TN</Link></li>
            <li><Link href="/ky/louisville" className="text-blue-600 hover:text-blue-700 font-medium">Louisville, KY</Link></li>
            <li><Link href="/md/baltimore" className="text-blue-600 hover:text-blue-700 font-medium">Baltimore, MD</Link></li>
            <li><Link href="/wi/milwaukee" className="text-blue-600 hover:text-blue-700 font-medium">Milwaukee, WI</Link></li>
            <li><Link href="/nm/albuquerque" className="text-blue-600 hover:text-blue-700 font-medium">Albuquerque, NM</Link></li>
            <li><Link href="/az/tucson" className="text-blue-600 hover:text-blue-700 font-medium">Tucson, AZ</Link></li>
            <li><Link href="/ca/fresno" className="text-blue-600 hover:text-blue-700 font-medium">Fresno, CA</Link></li>
            <li><Link href="/ca/sacramento" className="text-blue-600 hover:text-blue-700 font-medium">Sacramento, CA</Link></li>
            <li><Link href="/az/mesa" className="text-blue-600 hover:text-blue-700 font-medium">Mesa, AZ</Link></li>
            <li><Link href="/mo/kansas-city" className="text-blue-600 hover:text-blue-700 font-medium">Kansas City, MO</Link></li>
            <li><Link href="/ga/atlanta" className="text-blue-600 hover:text-blue-700 font-medium">Atlanta, GA</Link></li>
            <li><Link href="/ne/omaha" className="text-blue-600 hover:text-blue-700 font-medium">Omaha, NE</Link></li>
            <li><Link href="/co/colorado-springs" className="text-blue-600 hover:text-blue-700 font-medium">Colorado Springs, CO</Link></li>
            <li><Link href="/nc/raleigh" className="text-blue-600 hover:text-blue-700 font-medium">Raleigh, NC</Link></li>
            <li><Link href="/ca/long-beach" className="text-blue-600 hover:text-blue-700 font-medium">Long Beach, CA</Link></li>
            <li><Link href="/va/virginia-beach" className="text-blue-600 hover:text-blue-700 font-medium">Virginia Beach, VA</Link></li>
            <li><Link href="/fl/miami" className="text-blue-600 hover:text-blue-700 font-medium">Miami, FL</Link></li>
            <li><Link href="/ca/oakland" className="text-blue-600 hover:text-blue-700 font-medium">Oakland, CA</Link></li>
            <li><Link href="/mn/minneapolis" className="text-blue-600 hover:text-blue-700 font-medium">Minneapolis, MN</Link></li>
            <li><Link href="/fl/tampa" className="text-blue-600 hover:text-blue-700 font-medium">Tampa, FL</Link></li>
            <li><Link href="/ok/tulsa" className="text-blue-600 hover:text-blue-700 font-medium">Tulsa, OK</Link></li>
            <li><Link href="/tx/arlington" className="text-blue-600 hover:text-blue-700 font-medium">Arlington, TX</Link></li>
            <li><Link href="/la/new-orleans" className="text-blue-600 hover:text-blue-700 font-medium">New Orleans, LA</Link></li>
            <li><Link href="/ks/wichita" className="text-blue-600 hover:text-blue-700 font-medium">Wichita, KS</Link></li>
            <li><Link href="/oh/cleveland" className="text-blue-600 hover:text-blue-700 font-medium">Cleveland, OH</Link></li>
            <li><Link href="/ca/bakersfield" className="text-blue-600 hover:text-blue-700 font-medium">Bakersfield, CA</Link></li>
            <li><Link href="/co/aurora" className="text-blue-600 hover:text-blue-700 font-medium">Aurora, CO</Link></li>
            <li><Link href="/ca/anaheim" className="text-blue-600 hover:text-blue-700 font-medium">Anaheim, CA</Link></li>
            <li><Link href="/hi/honolulu" className="text-blue-600 hover:text-blue-700 font-medium">Honolulu, HI</Link></li>
            <li><Link href="/ca/santa-ana" className="text-blue-600 hover:text-blue-700 font-medium">Santa Ana, CA</Link></li>
            <li><Link href="/ca/riverside" className="text-blue-600 hover:text-blue-700 font-medium">Riverside, CA</Link></li>
            <li><Link href="/tx/corpus-christi" className="text-blue-600 hover:text-blue-700 font-medium">Corpus Christi, TX</Link></li>
            <li><Link href="/ky/lexington" className="text-blue-600 hover:text-blue-700 font-medium">Lexington, KY</Link></li>
            <li><Link href="/nv/henderson" className="text-blue-600 hover:text-blue-700 font-medium">Henderson, NV</Link></li>
            <li><Link href="/ca/stockton" className="text-blue-600 hover:text-blue-700 font-medium">Stockton, CA</Link></li>
            <li><Link href="/mn/saint-paul" className="text-blue-600 hover:text-blue-700 font-medium">Saint Paul, MN</Link></li>
            <li><Link href="/oh/cincinnati" className="text-blue-600 hover:text-blue-700 font-medium">Cincinnati, OH</Link></li>
            <li><Link href="/mo/st-louis" className="text-blue-600 hover:text-blue-700 font-medium">St. Louis, MO</Link></li>
            <li><Link href="/pa/pittsburgh" className="text-blue-600 hover:text-blue-700 font-medium">Pittsburgh, PA</Link></li>
            <li><Link href="/nc/greensboro" className="text-blue-600 hover:text-blue-700 font-medium">Greensboro, NC</Link></li>
            <li><Link href="/ne/lincoln" className="text-blue-600 hover:text-blue-700 font-medium">Lincoln, NE</Link></li>
            <li><Link href="/fl/orlando" className="text-blue-600 hover:text-blue-700 font-medium">Orlando, FL</Link></li>
            <li><Link href="/ca/irvine" className="text-blue-600 hover:text-blue-700 font-medium">Irvine, CA</Link></li>
            <li><Link href="/nj/newark" className="text-blue-600 hover:text-blue-700 font-medium">Newark, NJ</Link></li>
            <li><Link href="/nc/durham" className="text-blue-600 hover:text-blue-700 font-medium">Durham, NC</Link></li>
            <li><Link href="/ca/chula-vista" className="text-blue-600 hover:text-blue-700 font-medium">Chula Vista, CA</Link></li>
            <li><Link href="/oh/toledo" className="text-blue-600 hover:text-blue-700 font-medium">Toledo, OH</Link></li>
            <li><Link href="/in/fort-wayne" className="text-blue-600 hover:text-blue-700 font-medium">Fort Wayne, IN</Link></li>
            <li><Link href="/fl/st-petersburg" className="text-blue-600 hover:text-blue-700 font-medium">St. Petersburg, FL</Link></li>
            <li><Link href="/tx/laredo" className="text-blue-600 hover:text-blue-700 font-medium">Laredo, TX</Link></li>
            <li><Link href="/nj/jersey-city" className="text-blue-600 hover:text-blue-700 font-medium">Jersey City, NJ</Link></li>
            <li><Link href="/az/chandler" className="text-blue-600 hover:text-blue-700 font-medium">Chandler, AZ</Link></li>
            <li><Link href="/wi/madison" className="text-blue-600 hover:text-blue-700 font-medium">Madison, WI</Link></li>
            <li><Link href="/tx/lubbock" className="text-blue-600 hover:text-blue-700 font-medium">Lubbock, TX</Link></li>
            <li><Link href="/az/scottsdale" className="text-blue-600 hover:text-blue-700 font-medium">Scottsdale, AZ</Link></li>
            <li><Link href="/nv/reno" className="text-blue-600 hover:text-blue-700 font-medium">Reno, NV</Link></li>
            <li><Link href="/ny/buffalo" className="text-blue-600 hover:text-blue-700 font-medium">Buffalo, NY</Link></li>
            <li><Link href="/az/gilbert" className="text-blue-600 hover:text-blue-700 font-medium">Gilbert, AZ</Link></li>
            <li><Link href="/az/glendale" className="text-blue-600 hover:text-blue-700 font-medium">Glendale, AZ</Link></li>
            <li><Link href="/nv/north-las-vegas" className="text-blue-600 hover:text-blue-700 font-medium">North Las Vegas, NV</Link></li>
            <li><Link href="/nc/winston-salem" className="text-blue-600 hover:text-blue-700 font-medium">Winston-Salem, NC</Link></li>
            <li><Link href="/va/chesapeake" className="text-blue-600 hover:text-blue-700 font-medium">Chesapeake, VA</Link></li>
            <li><Link href="/va/norfolk" className="text-blue-600 hover:text-blue-700 font-medium">Norfolk, VA</Link></li>
            <li><Link href="/ca/fremont" className="text-blue-600 hover:text-blue-700 font-medium">Fremont, CA</Link></li>
            <li><Link href="/tx/garland" className="text-blue-600 hover:text-blue-700 font-medium">Garland, TX</Link></li>
            <li><Link href="/tx/irving" className="text-blue-600 hover:text-blue-700 font-medium">Irving, TX</Link></li>
            <li><Link href="/fl/hialeah" className="text-blue-600 hover:text-blue-700 font-medium">Hialeah, FL</Link></li>
            <li><Link href="/va/richmond" className="text-blue-600 hover:text-blue-700 font-medium">Richmond, VA</Link></li>
            <li><Link href="/id/boise" className="text-blue-600 hover:text-blue-700 font-medium">Boise, ID</Link></li>
            <li><Link href="/wa/spokane" className="text-blue-600 hover:text-blue-700 font-medium">Spokane, WA</Link></li>
            <li><Link href="/la/baton-rouge" className="text-blue-600 hover:text-blue-700 font-medium">Baton Rouge, LA</Link></li>
            <li><Link href="/wa/tacoma" className="text-blue-600 hover:text-blue-700 font-medium">Tacoma, WA</Link></li>
            <li><Link href="/ca/san-bernardino" className="text-blue-600 hover:text-blue-700 font-medium">San Bernardino, CA</Link></li>
            <li><Link href="/ca/modesto" className="text-blue-600 hover:text-blue-700 font-medium">Modesto, CA</Link></li>
            <li><Link href="/ia/des-moines" className="text-blue-600 hover:text-blue-700 font-medium">Des Moines, IA</Link></li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Our directory covers 100 major cities across the United States,
            with more being added regularly.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            For Business Owners
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Are you a garage door repair company looking to grow your business? Our
            directory helps thousands of homeowners find local garage door services
            every month.{" "}
            <Link
              href="/list-your-business"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              List your business
            </Link>{" "}
            to increase your online visibility, attract new customers, and stand out
            from the competition with a featured listing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Helpful Resources
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Beyond our directory listings, we publish in-depth{" "}
            <Link
              href="/#guides"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              garage door repair guides
            </Link>{" "}
            covering topics like repair costs, choosing the right garage door material,
            DIY maintenance tips, and when to call a professional. Our guides are written
            to help homeowners make informed decisions and save money on garage door
            services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Have questions, feedback, or need help finding a garage door repair company
            near you? Visit our{" "}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              contact page
            </Link>{" "}
            to get in touch with our team. We&apos;re here to help.
          </p>
        </div>
      </div>
    </div>
  );
}
