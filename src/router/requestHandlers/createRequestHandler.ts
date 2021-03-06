import { RequestHandler } from 'ask-sdk';
import { Response } from 'ask-sdk-model'; // 'ask-sdk-core/node_modules/ask-sdk-model'
import { RouteMatcher } from '../matcher';
import { Router, RouteSituation } from '../model';

type State = string;

const getSituation = <T extends State = State>(
  route: Router<T>
): RouteSituation | undefined => {
  const { situation } = route;
  return situation || undefined;
};

export class RequestHandlerFactory<T extends State = State> {
  private router: Router<T>[] = [];

  public addRoutes(...routers: Router<T>[]): this {
    this.router = [...this.router, ...routers];
    return this;
  }

  public createHandlers(): RequestHandler[] {
    return this.router.map(
      (route): RequestHandler => {
        return RequestHandlerFactory.create<T>(route);
      }
    );
  }

  public static create<T extends State = State>(
    route: Router<T>
  ): RequestHandler {
    return {
      async canHandle(handlerInput): Promise<boolean> {
        const matcher = new RouteMatcher<T>(handlerInput, route);
        await matcher.match();
        return matcher.getMatchResult();
      },
      handle: (input): Response | Promise<Response> => {
        /**
         * Auto state updator
         */
        const situation = getSituation(route);
        if (situation && situation.shouldEndSession !== undefined) {
          input.responseBuilder.withShouldEndSession(
            situation.shouldEndSession
          );
        }
        const result = route.handler(input);
        return result;
      },
    };
  }
}
