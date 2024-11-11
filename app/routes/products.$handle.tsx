import {Suspense} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import rocket from '../assets/images/icono_backpacks.png';
// Import Swiper styles

import {
  Await,
  Link,
  useLoaderData,
  type MetaFunction,
  type FetcherWithComponents,
} from '@remix-run/react';
import type {
  ProductFragment,
  ProductVariantsQuery,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {
  Image,
  Money,
  VariantSelector,
  type VariantOption,
  getSelectedProductOptions,
  CartForm,
  type OptimisticCartLine,
  Analytics,
  type CartViewPayload,
  useAnalytics,
} from '@shopify/hydrogen';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/lib/variants';
import {useAside} from '~/components/Aside';
import { Col, Container, Row } from 'react-bootstrap';

// import required modules
import { Navigation } from 'swiper/modules';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `NasaByTechZone | ${data?.product.title ?? ''}`}];
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
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  const Blog: any[] = await Promise.all([
    storefront.query(BLOG_ALT)
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  return {
    product,
    Blog
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: LoaderFunctionArgs) {
  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = context.storefront
    .query(VARIANTS_QUERY, {
      variables: {handle: params.handle!},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    variants,
  };
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {Blog}: any = useLoaderData<typeof loader>()
  const {product, variants} = useLoaderData<typeof loader>();
  const {selectedVariant, descriptionHtml, metafields} = product;
  const currentBlog = Blog[0].blog.articles.nodes[0];
  console.log(product, variants)
  return (
    <Container>
      <Row xs={1} md={2} className="main-product">
        { metafields[0]?.references?.nodes == undefined ? (
          <ProductImages isUnique={true} images={product.variants.nodes[0].image} />
        ) : 
        (
          <ProductImages isUnique={false} images={metafields[0]?.references?.nodes} />
        )}
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
        />
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </Row>
      <Row>
        <Col>
          
          <br />
          <div className='description_html' dangerouslySetInnerHTML={{__html: descriptionHtml}} />
          <br />
        </Col>
      </Row>
      <Row style={{justifyContent: 'center', marginTop: '5em'}}>
        <Col className='blog-container-product'>
          <a href={'/blogs/NasaByTechZone/' + currentBlog.handle} >
              <div className='blogText' dangerouslySetInnerHTML={{__html: currentBlog.excerptHtml}} />
              <div> <img src={currentBlog.image.url} width={350} height={'auto'} alt={currentBlog.title}/></div>
          </a>
        </Col>
      </Row>
    </Container>
   
  );
}

function ProductImages({images, isUnique}: {images: any, isUnique: boolean}) {
  if (!images) {
    return <div className="product-image" />;
  }
  return (
    <Col className="product-image">
      <div style={{ padding: '0 18%', justifyContent: 'center', display: 'flex'}}>
       <Swiper
          spaceBetween={0}
          slidesPerView={1}
          navigation={true} modules={[Navigation]}
          onSlideChange={() => console.log('slide change')}
          onSwiper={(swiper) => console.log(swiper)}
        >
          {isUnique ? (
            <SwiperSlide>
              <Image
                alt={images.altText || 'Product Image'}
                aspectRatio="2/3"
                data={images}
                sizes="(min-width: 45em) 50vw, 100vw"
              />
            </SwiperSlide>
          ) : (
            images.map((image: any, index: number) => (
              <SwiperSlide key={index + "product-image"}>
                <Image
                  alt={image.altText || 'Product Image'}
                  aspectRatio="2/3"
                  data={image.image}
                  sizes="(min-width: 45em) 50vw, 100vw"
                />
              </SwiperSlide>
            ))
          )}
          
        </Swiper>
      </div>
    </Col>
  );
}

function ProductMain({
  selectedVariant,
  product,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Promise<ProductVariantsQuery | null>;
}) {
  const {title, metafields} = product;
  const short_description: any = metafields[2];
  const ficha_tecnica: any = metafields[1];
  console.log(ficha_tecnica)
  
  return (
    <Col className="product-main">
      <Row md={1}>
          <Col>
              <h1 className='product-title'>{title}</h1>
          </Col>
          <Col>  
              <span className='product-short-description'>{short_description?.value}</span>
          </Col>
      </Row>
      <Row md={2} xs={1}>
        <Col>
            <div className='product_ficha_tecnica'>
              {ficha_tecnica && (
                <a href={ficha_tecnica.reference.url} title='Ficha Técnica'>
                  <img src={rocket} alt="rocket" width={25} height='auto' /> Ficha Técnica
                </a>
              )}
            </div>
        </Col>
        <Col>
          <ProductPrice selectedVariant={selectedVariant} />
        </Col>
      </Row>
      <Row md={1}>
        <Col>
          <Suspense
          fallback={
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={[]}
            />
          }
        >
          <Await
            errorElement="There was a problem loading product variants"
            resolve={variants}
          >
            {(data) => (
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={data?.product?.variants.nodes || []}
              />
            )}
          </Await>
        </Suspense>
        </Col>
      </Row>
      
      <br />
      <br />
      
    </Col>
  );
}

function ProductPrice({
  selectedVariant,
}: {
  selectedVariant: ProductFragment['selectedVariant'];
}) {
  return (
    <div className="product-price">
      {selectedVariant?.compareAtPrice ? (
        <>
          <p>Sale</p>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? <Money data={selectedVariant.price} /> : null}
            <s>
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          </div>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductVariantFragment>;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <div className="product-form">
      {/**<VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>**/}
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          open('cart');
          publish('cart_viewed', {
            cart,
            prevCart,
            shop,
            url: window.location.href || '',
          } as CartViewPayload);
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Añadir al carrito' : 'No disponible por el momento'}
      </AddToCartButton>
    </div>
  );
}

function ProductOptions({option}: {option: VariantOption}) {
  return (
    <div className="product-options" key={option.name}>
      <h5>{option.name}</h5>
      <div className="product-options-grid">
        {option.values.map(({value, isAvailable, isActive, to}) => {
          return (
            <Link
              className="product-options-item"
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              style={{
                border: isActive ? '1px solid black' : '1px solid transparent',
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {value}
            </Link>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLine>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    metafields(
      identifiers: [
        { namespace: "custom", key: "liverpool_images" }
        { namespace: "custom", key: "ficha_tecnica" }
        { namespace: "custom", key: "short_description" }
      ]
    ) {
      references(first: 10) {
        nodes {
          ... on MediaImage {
            __typename
            id
            image {
              altText
              height
              id
              url
              width
            }
          }
        }
      }
      value
      reference {
        ... on GenericFile {
          id
          url
        }
      }
      key
      
    }
    handle
    featuredImage {
      url
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;


const BLOG_ALT = `#graphql
query Blog {
  blog(handle: "NasaByTechZone") {
    articles(sortKey: PUBLISHED_AT, first: 1) {
      nodes {
        handle
        excerptHtml
        contentHtml
        image {
          url
        }
        title
      }
    }
  }
}
` as const