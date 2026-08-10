import { Inventory } from "../inventory/Inventory";
import { Player } from "../entities/Player";
import type { SavedQuestState } from "../save/SaveManager";

export interface QuestDefinition {
  id: string;
  title: string;
  giverName: string;
  objectiveItemId: string;
  requiredCount: number;
  rewardGold: number;
  rewardXp: number;
  introText: string;
  activeText: string;
  completeText: string;
  turnInText: string;
}

export class QuestManager {
  public readonly quest: QuestDefinition = {
    id: "goblin_ears",
    title: "Eco da Floresta",
    giverName: "Elder Mira",
    objectiveItemId: "goblin_ear",
    requiredCount: 3,
    rewardGold: 60,
    rewardXp: 80,
    introText: "A floresta ficou perigosa. Traga 3 Orelhas de Goblin para provar sua coragem.",
    activeText: "Continue caçando Goblins. Você ainda precisa de mais provas.",
    completeText: "Perfeito. Você já reuniu tudo o que eu pedi.",
    turnInText: "Excelente trabalho, Guardião. A recompensa é sua."
  };

  private accepted = false;
  private completed = false;

  public isAccepted(): boolean {
    return this.accepted;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public accept(): void {
    this.accepted = true;
  }

  public getProgress(inventory: Inventory): number {
    return Math.min(inventory.countItem(this.quest.objectiveItemId), this.quest.requiredCount);
  }

  public isReadyToTurnIn(inventory: Inventory): boolean {
    return this.accepted && !this.completed && this.getProgress(inventory) >= this.quest.requiredCount;
  }

  public getQuestStateText(inventory: Inventory): string {
    if (this.completed) {
      return `${this.quest.title}: concluída.`;
    }

    if (!this.accepted) {
      return `${this.quest.title}: ${this.quest.introText}`;
    }

    const progress = this.getProgress(inventory);
    if (progress >= this.quest.requiredCount) {
      return `${this.quest.title}: ${this.quest.completeText}`;
    }

    return `${this.quest.title}: ${this.quest.activeText} (${progress}/${this.quest.requiredCount})`;
  }

  public getActionText(inventory: Inventory): string {
    if (this.completed) {
      return "Missão já concluída.";
    }

    if (!this.accepted) {
      return "Pressione Q para aceitar a missão.";
    }

    if (this.isReadyToTurnIn(inventory)) {
      return "Pressione Q para entregar a missão.";
    }

    return "Continue coletando os itens pedidos.";
  }

  public turnIn(player: Player, inventory: Inventory): boolean {
    if (!this.isReadyToTurnIn(inventory)) {
      return false;
    }

    inventory.removeItem(this.quest.objectiveItemId, this.quest.requiredCount);
    player.addGold(this.quest.rewardGold);
    player.gainXp(this.quest.rewardXp);

    this.completed = true;
    return true;
  }

  public serialize(): SavedQuestState {
    return {
      id: this.quest.id,
      accepted: this.accepted,
      completed: this.completed
    };
  }

  public loadFromData(data: SavedQuestState | null): void {
    if (!data || data.id !== this.quest.id) {
      this.accepted = false;
      this.completed = false;
      return;
    }

    this.accepted = data.accepted;
    this.completed = data.completed;
  }
}
