import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = () => {
    return (
        <div>
            <nav className="navbar navbar-expand-lg 
                            navbar-light bg-dark 
                            bg-opacity-75 text-light">
                <div className="container">
                    <Link className="navbar-brand 
                                    text-light font-bold"
                        href="/">
                        EVENTHUB
                    </Link>
                    <div className="collapse navbar-collapse"
                        id="navbarNav">
                        <ul className="navbar-nav mr-auto">
                            <li className="nav-item">
                                <Link href="/about"
                                    className="nav-item nav-link 
                                                 text-light">
                                    About
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/Contact"
                                    className="nav-item nav-link 
                                                 text-light">
                                    Events
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="services"
                                    className="nav-item nav-link 
                                                text-light">
                                    Marketplace
                                </Link>
                            </li>
                            add accordion in here for login/logout related features
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    );
};

/* import Layout from '@/components/layout'; 
Run this ^ on every page to add the nav bar */

export default Navbar;