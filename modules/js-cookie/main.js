// import
import Cookie from 'js-cookie';

// set a cookie
Cookie.set('name', 'value');

// get a cookie
console.log(Cookie.get('name'));

// get all cookies as an object
console.log(Cookie.get());

// remove a cookie
Cookie.remove('name');

// set a cookie with expiration 7 days
Cookie.set('name', 'value', { expires: 7 });