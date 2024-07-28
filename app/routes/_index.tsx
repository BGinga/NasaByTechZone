import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense, useEffect, useState} from 'react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import {Col, Container, Row } from 'react-bootstrap';
import Astronaut from '../assets/images/astronauta.png';
import IconoAccesorios from '../assets/images/icono_accesorios.png';
import IconoBackpacks from '../assets/images/icono_backpacks.png';
import IconoSillas from '../assets/images/icono_sillas.png';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import { useVariantUrl } from '~/lib/variants';

export const meta: MetaFunction = () => {
  return [{title: 'NasaByTechZone | Inicio'}];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [backpacks] = await Promise.all([
    context.storefront.query(COLLECCTION_NASA, {
      variables: { handle: 'backpacks-nasa' }
    })
  ]);
  const [accesorios] = await Promise.all([
    context.storefront.query(COLLECCTION_NASA, {
      variables: { handle: 'accesorios-nasa' }
    })
  ]);
  const [sillas] = await Promise.all([
    context.storefront.query(COLLECCTION_NASA, {
      variables: { handle: 'sillas-nasa' }
    })
  ]);

  return {
      backpacks, accesorios, sillas
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  {
    /*const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });*/
  }

  return {
    /*recommendedProducts,*/
  };
}

export const Homepage = () => {
  const data = useLoaderData<typeof loader>();
  const {backpacks} = data;
  const {accesorios} = data;
  const {sillas} = data;
  const [isAbsolute, setIsAbsolute] = useState(false);
  const [topOffset, setTopOffset] = useState(0);

  const handleScroll = () => {
    const container = document.querySelector('.astronaut-container');
    const containerRect = container!!.getBoundingClientRect();
   
    
    if (containerRect.top <= 0) {
      setIsAbsolute(true);
      setTopOffset(scrollY);
    } else {
      setIsAbsolute(false);
      setTopOffset(0);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <Container fluid>
      <Row className="astronaut-row">
        <Col md="5" lg="5" sm="5" className='astronaut-container'>
          <img style={{top: `${topOffset}px`}} className="absolute astronaut" src={Astronaut} width={600} />
        </Col>
        <Col md="7" lg="7" sm="7">
          <span className="home-phrase nasalization">¡ASOMBRATE COMO NUNCA!</span>
        </Col>
      </Row>
      <Row className=''>
        <Col md={12} className="title-container">
          <span>
            <img src={IconoBackpacks} width={100} height={'auto'} />
          </span>
          <h1 className="title NASA">BACKPACKS</h1>
        </Col>
        <Col md={12} className='description nasalization'>
            <span>{backpacks.collection?.description}</span>
        </Col>
        <Col md={12} className='product-container'>
            <SlidesMakerCollection products={backpacks.collection?.products.edges} />
        </Col>
      </Row>
      <Row>
        <div className="title-container rev">
          <span>
            <img src={IconoAccesorios} width={100} height={'auto'} />
          </span>
          <h1 className="title NASA">Accesorios</h1>
        </div>
        <Row className='description nasalization'>
            <span>{accesorios.collection?.description}</span>
        </Row>
        <Row className='product-container'>
            <SlidesMakerCollection products={accesorios.collection?.products.edges} />
        </Row>
      </Row>
      <Row>
        <div className="title-container">
          <span>
            <img src={IconoSillas} width={100} height={'auto'} />
          </span>
          <h1 className="title NASA">Sillas</h1>
        </div>
        <Row className='description nasalization'>
            <span>{sillas.collection?.description}</span>
        </Row>
        <Row className='product-container'>
            <SlidesMakerCollection products={sillas.collection?.products.edges} />
        </Row>
      </Row>
    </Container>
  );
};

const SlidesMakerCollection = ({products}: any) => {

  return(
      <Swiper
        spaceBetween={0}
        slidesPerView={4}
        className='swiperHome'
      >
      {products.map( (product: any, index: number) => {
        const variant = product.node.variants.nodes[0];
        const variantUrl = useVariantUrl(product.node.handle, variant.selectedOptions);

        return(
          <SwiperSlide key={index + product.node.handle}>
            <Link
              className="carrousel-product"
              key={product.id}
              prefetch="intent"
              to={variantUrl}
            >
              {product.node.featuredImage && (
                <Image
                  alt={product.node.featuredImage.altText || product.node.title}
                  data={product.node.featuredImage}
                  className='product-carousel-image '
                  aspectRatio="1/1"
                  width={300}
                  height={300}
                  sizes="(min-width: 56em) 400px, 100vw"
                />
              )}
              <h4>{product.title}</h4>
              
            </Link>
          </SwiperSlide>
        )
      
      })}
    </Swiper>
  )
}
const COLLECCTION_NASA = `#graphql
query getCollectionByHandle($handle: String = "") {
  collection(handle: $handle) {
    description
    products(first: 20) {
      edges {
        node {
          handle
          images(first: 2) {
            edges {
              node {
                url
              }
            }
          }
          title
          vendor
          featuredImage {
            id
            altText
            url
            width
            height
          }
          variants(first: 1) {
            nodes {
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
}
` as const;

export default Homepage;
