Feature: Safety zone selection

  Scenario: Default safety zone is safe-zone
    Given I open the skill tree page
    Then the "Safe-zone" button should be active

  Scenario: Select a different safety zone
    Given I open the skill tree page
    When I click the "Hardcore" safety zone button
    Then the "Hardcore" button should be active
    And the "Safe-zone" button should not be active
    And I should see the hardcore zone description
