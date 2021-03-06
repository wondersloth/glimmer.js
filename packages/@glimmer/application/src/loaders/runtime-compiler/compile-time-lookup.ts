import { ResolverDelegate, templateFactory } from "@glimmer/opcode-compiler";
import {
  ComponentDefinition as IComponentDefinition,
  CompilableTemplate,
  ComponentCapabilities,
  ProgramSymbolTable,
  ComponentManager,
  WithJitStaticLayout,
  ComponentInstanceState,
  ComponentDefinitionState,
  CompileTimeComponent,
  SerializedTemplateWithLazyBlock
} from "@glimmer/interfaces";
import { Option, assert } from "@glimmer/util";

import { Specifier } from "./loader";
import ApplicationJitRuntimeResolver from "./resolver";
import ComponentDefinitionImpl from "@glimmer/component/src/component-definition";

type ComponentDefinition = IComponentDefinition<ComponentManager>;

export default class ResolverDelegateImpl implements ResolverDelegate {
  constructor(private resolver: ApplicationJitRuntimeResolver) {}

  private getComponentDefinition(handle: number): ComponentDefinition {
    let spec = this.resolver.resolve<Option<ComponentDefinition>>(handle);

    assert(!!spec, `Couldn't find a template for ${handle}`);

    return spec!;
  }

  getCapabilities(handle: number): ComponentCapabilities {
    let definition = this.getComponentDefinition(handle);
    let { manager, state } = definition!;
    return manager.getCapabilities(state);
  }

  getLayout(handle: number): CompilableTemplate<ProgramSymbolTable> {
    let definition = this.getComponentDefinition(handle);
    let { manager } = definition;
    return (manager as WithJitStaticLayout<
      ComponentInstanceState,
      ComponentDefinitionState,
      ApplicationJitRuntimeResolver
    >).getJitStaticLayout(definition, this.resolver);
  }

  lookupHelper(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponentDefinition(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupComponentHandle(name, referrer);
  }

  lookupComponent(
    name: string,
    referrer: Specifier
  ): Option<CompileTimeComponent> {
    let component = this.lookupComponentDefinition(name, referrer);
    let definition: ComponentDefinitionImpl = this.resolver.resolve(component);
    let template: SerializedTemplateWithLazyBlock<
      Specifier
    > = this.resolver.resolve(definition.handle);

    return {
      handle: component,
      capabilities: definition.manager.getCapabilities(definition.state),
      compilable: templateFactory(template)
        .create()
        .asLayout()
    };
  }

  lookupPartial(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupPartial(name, referrer);
  }
}
